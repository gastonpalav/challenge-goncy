import { NextResponse } from 'next/server';
import { take } from '@/limits';
import { ensureVisitor, simKey, simState, SIM_TTL, type SimResponse } from '@/sim/server';
import { availableCanned, playCanned } from '@/sobrino/canned';
import { handle } from '@/sobrino/handle';
import { canInterpret, interpret } from '@/sobrino/interpret';
import { fakeAsker } from '@/sobrino/interpret.fake';
import * as say from '@/sobrino/phrases';
import { SAMPLE_PHOTOS } from '@/sobrino/samples';
import { isLive, withLiveNote } from '@/sobrino/stream';
import { transcribe } from '@/sobrino/transcribe';
import type { Message, Reply, Session } from '@/sobrino/types';
import { getStore, loadOrSeed } from '@/store';

const MAX_TEXT = 300;
/** Diez segundos de audio comprimido entran cómodos en 500 KB. */
const MAX_AUDIO_BYTES = 500_000;
const E2E = process.env.E2E === '1';

type Body =
  | { kind: 'canned'; id: string }
  | { kind: 'button'; label: string }
  | { kind: 'text'; text: string }
  | { kind: 'samplePhoto'; image: string }
  | { kind: 'audio'; file: Blob };

type Result = { session: Session; replies: Reply[]; heard?: string };

function parse(raw: unknown): Body | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const body = raw as Record<string, unknown>;
  if (body.kind === 'canned' && typeof body.id === 'string') return { kind: 'canned', id: body.id };
  if (body.kind === 'button' && typeof body.label === 'string') {
    return { kind: 'button', label: body.label.slice(0, 40) };
  }
  if (body.kind === 'samplePhoto') {
    // Solo se aceptan las fotos de la lista: el visitante no puede colar otra dirección.
    const sample = SAMPLE_PHOTOS.find((s) => s.id === body.id);
    return sample ? { kind: 'samplePhoto', image: sample.image } : null;
  }
  if (body.kind === 'text' && typeof body.text === 'string') {
    const text = body.text.trim().slice(0, MAX_TEXT);
    return text ? { kind: 'text', text } : null;
  }
  return null;
}

/** Si hay una pregunta de Sí / No abierta y Norma contesta escribiendo, vale como el botón. */
function typedAnswer(session: Session, text: string): Message | null {
  const pending = session.pending;
  if (!pending) return null;
  const plain = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .trim();
  if (pending.type !== 'choosePiece') {
    if (/^(si|sip|sisi|si si|dale|esa|esa es)$/.test(plain)) return { kind: 'button', label: say.YES };
    if (/^(no|nono|no no|esa no)$/.test(plain)) return { kind: 'button', label: say.NO };
  }
  return null;
}

async function onText(session: Session, text: string, visitor: string, now: number): Promise<Result> {
  // Contestar "sí" o "no" no necesita modelo ni gasta cupo.
  const answer = typedAnswer(session, text);
  if (answer) return handle(session, answer, now);

  if (!(E2E || canInterpret()) ||!(await take(getStore(), visitor, 'text'))) {
    return { session, replies: [{ text: say.outOfCredit() }] };
  }
  const intent = await interpret(text, session, E2E ? { ask: fakeAsker } : {});
  return handle(session, { kind: 'intent', intent }, now);
}

async function readBody(request: Request): Promise<Body | null> {
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('multipart/form-data')) {
    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    if (form?.get('kind') !== 'audio' || !(file instanceof Blob)) return null;
    return { kind: 'audio', file };
  }
  return parse(await request.json().catch(() => null));
}

/** Un audio grabado con el micrófono: se pasa a texto y sigue el mismo camino que el texto. */
async function onAudio(session: Session, file: Blob, visitor: string, now: number): Promise<Result> {
  const failed: Result = { session, replies: [{ text: say.micFailed() }] };
  if (file.size === 0 || file.size > MAX_AUDIO_BYTES || !file.type.startsWith('audio/')) return failed;

  const canHear = E2E || Boolean(process.env.GROQ_API_KEY && canInterpret());
  if (!canHear || !(await take(getStore(), visitor, 'audio'))) {
    return { session, replies: [{ text: say.outOfCredit() }] };
  }

  let heard: string;
  try {
    heard = E2E ? 'vendí el cuenco' : await transcribe(file);
  } catch (error) {
    console.error('audio: no se pudo transcribir', error);
    return failed;
  }
  if (!heard) return failed;

  const answer = typedAnswer(session, heard);
  if (answer) return { ...handle(session, answer, now), heard };
  const intent = await interpret(heard.slice(0, MAX_TEXT), session, E2E ? { ask: fakeAsker } : {});
  return { ...handle(session, { kind: 'intent', intent }, now), heard };
}

export async function POST(request: Request) {
  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: 'Mensaje inválido' }, { status: 400 });

  const store = getStore();
  const visitor = await ensureVisitor();
  const key = simKey(visitor);
  const session = await loadOrSeed(store, key, SIM_TTL);
  const now = Date.now();

  let result: Result;
  if (body.kind === 'canned') {
    // Solo se aceptan los audios que tienen sentido con el catálogo como está.
    const canned = availableCanned(session).find((c) => c.id === body.id);
    result = canned ? playCanned(session, canned, now) : { session, replies: [{ text: say.notUnderstood() }] };
  } else if (body.kind === 'button') {
    result = handle(session, { kind: 'button', label: body.label }, now);
  } else if (body.kind === 'samplePhoto') {
    result = handle(session, { kind: 'photo', image: body.image }, now);
  } else if (body.kind === 'audio') {
    result = await onAudio(session, body.file, visitor, now);
  } else {
    result = await onText(session, body.text, visitor, now);
  }

  // En las pruebas no depende de la hora en que se corran.
  result = withLiveNote(session, result, now, !E2E && isLive(now));

  await store.setSession(key, result.session, SIM_TTL);
  const response: SimResponse = { ...simState(result.session), replies: result.replies, heard: result.heard };
  return NextResponse.json(response);
}
