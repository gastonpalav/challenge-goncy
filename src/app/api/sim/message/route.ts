import { NextResponse } from 'next/server';
import { ensureVisitor, simKey, simState, SIM_TTL, type SimResponse } from '@/sim/server';
import { availableCanned, playCanned } from '@/sobrino/canned';
import { handle } from '@/sobrino/handle';
import * as say from '@/sobrino/phrases';
import type { Reply, Session } from '@/sobrino/types';
import { getStore, loadOrSeed } from '@/store';

type Body = { kind: 'canned'; id: string } | { kind: 'button'; label: string };

function parse(raw: unknown): Body | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const body = raw as Record<string, unknown>;
  if (body.kind === 'canned' && typeof body.id === 'string') return { kind: 'canned', id: body.id };
  if (body.kind === 'button' && typeof body.label === 'string') {
    return { kind: 'button', label: body.label.slice(0, 40) };
  }
  return null;
}

export async function POST(request: Request) {
  const body = parse(await request.json().catch(() => null));
  if (!body) return NextResponse.json({ error: 'Mensaje inválido' }, { status: 400 });

  const store = getStore();
  const key = simKey(await ensureVisitor());
  const session = await loadOrSeed(store, key, SIM_TTL);
  const now = Date.now();

  let result: { session: Session; replies: Reply[] };
  if (body.kind === 'canned') {
    // Solo se aceptan los audios que tienen sentido con el catálogo como está.
    const canned = availableCanned(session).find((c) => c.id === body.id);
    result = canned ? playCanned(session, canned, now) : { session, replies: [{ text: say.notUnderstood() }] };
  } else {
    result = handle(session, { kind: 'button', label: body.label }, now);
  }

  await store.setSession(key, result.session, SIM_TTL);
  const response: SimResponse = { ...simState(result.session), replies: result.replies };
  return NextResponse.json(response);
}
