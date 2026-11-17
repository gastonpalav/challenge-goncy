import type { Metadata } from 'next';
import { currentVisitor, simKey, simState } from '@/sim/server';
import { seedSession } from '@/sobrino/seed';
import { getStore } from '@/store';
import { Simulador } from './_components/Simulador';
import './simulador.css';

export const metadata: Metadata = {
  title: 'Hacé de Norma · La manito de Norma',
  description: 'Simulador: actualizá la página de Norma como lo hace ella, hablándole por WhatsApp a su sobrino.',
  robots: { index: false },
};

export default async function Page() {
  // Si el visitante ya tiene una copia, se la mostramos. Si no, ve la muestra;
  // la copia se crea recién con su primer mensaje.
  const visitor = await currentVisitor();
  const saved = visitor ? await getStore().getSession(simKey(visitor)) : null;
  return <Simulador initial={simState(saved ?? seedSession())} />;
}
