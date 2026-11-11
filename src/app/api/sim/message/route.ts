import { NextResponse } from 'next/server';
import { take } from '@/limits';
import { ensureVisitor, simKey, simState, SIM_TTL, type SimResponse } from '@/sim/server';
import { availableCanned, playCanned } from '@/sobrino/canned';
import { handle } from '@/sobrino/handle';
import { interpret } from '@/sobrino/interpret';
import { fakeAsker } from '@/sobrino/interpret.fake';
import * as say from '@/sobrino/phrases';
import { SAMPLE_PHOTOS } from '@/sobrino/samples';
import type { Message, Reply, Session } from '@/sobrino/types';
import { getStore, loadOrSeed } from '@/store';

const MAX_TEXT = 300;
const E2E = process.env.E2E === '1';

type Body =
  | { kind: 'canned'; id: string }
  | { kind: 'button'; label: string }
  | { kind: 'text'; text: string }
  | { kind: 'samplePhoto'; image: string };

type Result = { session: Session; replies: Reply[] };

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

  const canInterpret = E2E || Boolean(process.env.ANTHROPIC_API_KEY);
  if (!canInterpret || !(await take(getStore(), visitor, 'text'))) {
    return { session, replies: [{ text: say.outOfCredit() }] };
  }
  const intent = await interpret(text, session, E2E ? { ask: fakeAsker } : {});
  return handle(session, { kind: 'intent', intent }, now);
}

export async function POST(request: Request) {
  const body = parse(await request.json().catch(() => null));
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
  } else {
    result = await onText(session, body.text, visitor, now);
  }

  await store.setSession(key, result.session, SIM_TTL);
  const response: SimResponse = { ...simState(result.session), replies: result.replies };
  return NextResponse.json(response);
}
