import Image from 'next/image';
import type { Piece } from '@/sobrino/types';
import { PriceTag } from './PriceTag';

export function PieceCard({ piece, priority }: { piece: Piece; priority: boolean }) {
  return (
    <li className="pieza">
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
    </li>
  );
}
