import { NextResponse } from 'next/server';
import { currentVisitor, simKey } from '@/sim/server';
import { getStore } from '@/store';

/** Solo para los tests de punta a punta: borra la copia del visitante, como si hubiera vencido. */
export async function POST() {
  if (process.env.E2E !== '1') return new NextResponse(null, { status: 404 });
  const visitor = await currentVisitor();
  if (visitor) await getStore().deleteSession(simKey(visitor));
  return NextResponse.json({ ok: true });
}
