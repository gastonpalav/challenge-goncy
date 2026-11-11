import { NextResponse } from 'next/server';
import { ensureVisitor, simKey, simState, SIM_TTL, type SimResponse } from '@/sim/server';
import { seedSession } from '@/sobrino/seed';
import { getStore } from '@/store';

/** Empezar de nuevo: la copia del visitante vuelve a ser el catálogo de muestra. */
export async function POST() {
  const session = seedSession();
  await getStore().setSession(simKey(await ensureVisitor()), session, SIM_TTL);
  const response: SimResponse = { ...simState(session), replies: [] };
  return NextResponse.json(response);
}
