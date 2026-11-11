import { notFound } from 'next/navigation';
import { seedSession } from '@/sobrino/seed';
import type { Piece } from '@/sobrino/types';
import { Storefront } from '../../_components/Storefront';

// Casos armados para los tests de punta a punta. Fuera de esos tests, la ruta no existe.
const CASOS: Record<string, () => Piece[]> = {
  vacio: () => [],
  largo: () => {
    const [primera, ...resto] = seedSession().catalog;
    return [
      {
        ...primera,
        title: 'Azucarera grande con tapa y cucharita, esmalte azul profundo',
        price: 1_250_000,
      },
      ...resto,
    ];
  },
};

export default async function Page({ params }: { params: Promise<{ caso: string }> }) {
  const { caso } = await params;
  const armar = CASOS[caso];
  if (process.env.E2E !== '1' || !armar) notFound();
  return <Storefront pieces={armar()} />;
}
