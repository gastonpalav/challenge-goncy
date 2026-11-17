import Image from 'next/image';
import Link from 'next/link';
import type { Piece } from '@/sobrino/types';
import { PriceTag } from './PriceTag';

type Props = {
  piece: Piece;
  priority: boolean;
  /** En la página pública, tocar la pieza lleva a escribirle a Norma. */
  consultas?: boolean;
};

export function PieceCard({ piece, priority, consultas = false }: Props) {
  const contenido = (
    <>
      <div className="pieza-foto">
        <Image
          src={piece.image}
          alt=""
          width={960}
          height={1200}
          sizes="(min-width: 960px) 340px, (min-width: 600px) 46vw, 92vw"
          priority={priority}
        />
        <PriceTag price={piece.price} />
      </div>
      <h2 className="pieza-titulo">{piece.title}</h2>
    </>
  );

  return (
    <li className="pieza">
      {consultas ? (
        <Link className="pieza-enlace" href={`/consulta/${piece.id}`}>
          {contenido}
          <span className="pieza-escribir">Escribirle a Norma</span>
        </Link>
      ) : (
        contenido
      )}
    </li>
  );
}
