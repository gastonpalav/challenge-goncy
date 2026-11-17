import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { availableCanned } from '@/sobrino/canned';
import type { Piece, Reply, Session } from '@/sobrino/types';

const COOKIE = 'visitante';
const UUID = /^[0-9a-f-]{36}$/;

/** Cada copia de prueba dura un día desde su último uso. */
export const SIM_TTL = 86_400;

export const simKey = (visitor: string) => `sim:${visitor}`;

/** El visitante actual según su cookie, o undefined si todavía no tiene. */
export async function currentVisitor(): Promise<string | undefined> {
  const value = (await cookies()).get(COOKIE)?.value;
  return value && UUID.test(value) ? value : undefined;
}

/** Devuelve el visitante actual; si no tenía cookie, se la crea. Solo para route handlers. */
export async function ensureVisitor(): Promise<string> {
  const existing = await currentVisitor();
  if (existing) return existing;
  const visitor = randomUUID();
  (await cookies()).set(COOKIE, visitor, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return visitor;
}

export type Chip = { id: string; label: string; audio?: string; photo?: string };

export type SimState = { catalog: Piece[]; chips: Chip[] };
/** heard: lo que el sobrino entendió de un audio grabado con el micrófono. */
export type SimResponse = SimState & { replies: Reply[]; heard?: string };

export function simState(session: Session): SimState {
  return {
    catalog: session.catalog,
    chips: availableCanned(session).map(({ id, label, audio, photo }) => ({ id, label, audio, photo })),
  };
}
