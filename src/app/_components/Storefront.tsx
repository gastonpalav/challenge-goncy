import type { Piece } from "@/sobrino/types";
import { Grid } from "./Grid";

type Props = {
  pieces: Piece[];
  /** Solo en la página pública: cada pieza lleva a escribirle a Norma. */
  consultas?: boolean;
};

/** La página de Norma completa: cartel, aviso, grilla y la marca al pie. */
export function Storefront({ pieces, consultas = false }: Props) {
  return (
    <main className="puesto">
      <header className="puesto-cabecera">
        <div className="puesto-ancho">
          <h1>La manito de Norma</h1>
          <p>
            {consultas
              ? "Cerámicas hechas a mano. Si te gusta alguna, tocala y escribile a Norma."
              : "Cerámicas hechas a mano. Si te gusta alguna, mandale un mensaje a Norma."}
          </p>
        </div>
      </header>
      <div className="cenefa cenefa-arriba" />
      <div className="puesto-ancho">
        <Grid pieces={pieces} consultas={consultas} />
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
