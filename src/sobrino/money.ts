/** 15000 -> "$ 15.000" */
export function formatPrice(n: number): string {
  const digits = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$ ${digits}`;
}

export const MAX_PRICE = 10_000_000;

/** Un precio que se puede publicar sin preguntar nada. */
export function isValidPrice(n: number): boolean {
  return Number.isInteger(n) && n > 0 && n <= MAX_PRICE;
}
