import type { Piece } from "@/sobrino/types";
import { Grid } from "./Grid";

type Props = {
  pieces: Piece[];
  /** Solo en la página pública: cada pieza lleva a escribirle a Norma. */
  consultas?: boolean;
};

/** La página de Norma completa: cartel, su refrán, grilla y la firma al pie. */
export function Storefront({ pieces, consultas = false }: Props) {
  return (
    <main className="puesto">
      <header className="puesto-cabecera">
        <div className="puesto-ancho">
          <div className="puesto-titulo">
            <h1>La manito de Norma</h1>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="puesto-normita" src="/porcelana/normita.svg" alt="" width={120} height={146} />
          </div>
          <p>“Lo que se hace con las manos no sale dos veces igual”, dice siempre Norma.</p>
        </div>
      </header>
      <div className="cenefa cenefa-arriba" />
      <div className="puesto-ancho">
        <Grid pieces={pieces} consultas={consultas} />
      </div>
      <footer className="puesto-pie">
        <div className="puesto-ancho">
          <p className="puesto-despedida">Vuelvan pronto, que siempre hay algo saliendo del horno.</p>
          <p className="puesto-marca">Norma</p>
        </div>
        <div className="cenefa cenefa-abajo" />
      </footer>
    </main>
  );
}
