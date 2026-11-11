import { formatPrice } from '@/sobrino/money';

/** El cartelito de feria con el precio. El texto es real: se puede leer, copiar y escuchar. */
export function PriceTag({ price }: { price: number }) {
  return <p className="cartelito">{formatPrice(price)}</p>;
}
