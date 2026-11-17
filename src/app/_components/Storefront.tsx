import type { Piece } from "@/sobrino/types";
import { Grid } from "./Grid";

/** La página de Norma completa: cartel, aviso, grilla y la marca al pie. */
export function Storefront({ pieces }: { pieces: Piece[] }) {
  return (
    <main className="puesto">
      <header className="puesto-cabecera">
        <div className="puesto-ancho">
          <h1>Cerámicas de Norma</h1>
          <p>
            Piezas hechas a mano. Si te gusta alguna, mandale un mensaje a
            Norma.
          </p>
        </div>
      </header>
      <div className="cenefa cenefa-arriba" />
      <div className="puesto-ancho">
        <Grid pieces={pieces} />
      </div>
      <footer className="puesto-pie">
        <div className="cenefa cenefa-abajo" />
        <div className="puesto-ancho">
          <p className="puesto-marca">Norma</p>
          <p>Cada pieza es única. Cuando se vende, no hay otra igual.</p>
        </div>
      </footer>
    </main>
  );
}
