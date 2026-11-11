import type { Piece } from '@/sobrino/types';
import { Grid } from './Grid';

/** La página de Norma completa: cartel, aviso y grilla. */
export function Storefront({ pieces }: { pieces: Piece[] }) {
  return (
    <main className="puesto">
      <header className="puesto-cabecera">
        <h1>Cerámicas de Norma</h1>
        <p>Piezas hechas a mano. Si te gusta alguna, mandale un mensaje a Norma.</p>
      </header>
      <Grid pieces={pieces} />
    </main>
  );
}
