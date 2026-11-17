import type { Metadata } from 'next';
import Link from 'next/link';
import { getStore, loadOrSeed, REAL } from '@/store';
import { Consulta } from './_components/Consulta';
import '../consulta.css';

export const metadata: Metadata = {
  title: 'Escribile a Norma · Cerámicas de Norma',
  description: 'Muestra de cómo se arregla con Norma cuando te gusta una pieza.',
  robots: { index: false },
};

// Igual que la página: si Norma vendió la pieza, a los 5 minutos ya no se puede consultar.
export const revalidate = 300;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await loadOrSeed(getStore(), REAL);
  const piece = session.catalog.find((p) => p.id === id);

  if (!piece) {
    return (
      <main className="con-entrada">
        <h1>Esa pieza ya no está</h1>
        <p className="con-nohay">Puede que Norma la haya vendido. Cada pieza es única.</p>
        <Link className="con-volver" href="/">
          ‹ Volver a las piezas
        </Link>
      </main>
    );
  }

  return <Consulta piece={piece} />;
}
