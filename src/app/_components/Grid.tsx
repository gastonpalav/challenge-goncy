import type { Piece } from '@/sobrino/types';
import { EmptyState } from './EmptyState';
import { PieceCard } from './PieceCard';

/** La grilla de piezas. La usan la página pública y la copia de prueba del simulador. */
export function Grid({ pieces, consultas = false }: { pieces: Piece[]; consultas?: boolean }) {
  if (pieces.length === 0) return <EmptyState />;
  return (
    <ul className="grilla">
      {pieces.map((piece, i) => (
        <PieceCard key={piece.id} piece={piece} priority={i === 0} consultas={consultas} />
      ))}
    </ul>
  );
}
