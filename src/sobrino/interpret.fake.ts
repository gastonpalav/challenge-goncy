import type { Asker } from './interpret';

/**
 * Modelo de mentira para los tests de punta a punta: entiende un puñado de frases
 * con reglas fijas. No se usa nunca fuera de esos tests.
 */

const plain = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export const fakeAsker: Asker = async ({ context, message }) => {
  const text = plain(message);
  const catalogLine = context.split('\n').find((line) => line.startsWith('[')) ?? '[]';
  const catalog = JSON.parse(catalogLine) as { id: string; title: string }[];
  const pieceIds = catalog
    .filter((p) => plain(p.title).split(' ').some((word) => word.length > 3 && text.includes(word)))
    .map((p) => p.id);
  const digits = text.match(/\d+/);
  const price = digits ? Number(digits[0]) : null;
  const base = { title: null, price: null, pieceIds: [] as string[] };

  if (/vendi/.test(text)) return { ...base, action: 'sold', pieceIds };
  if (/equivoque/.test(text)) return { ...base, action: 'undo' };
  if (/hola|comiste/.test(text)) return { ...base, action: 'smalltalk' };
  if (/foto nueva/.test(text)) return { ...base, action: 'photo', pieceIds };
  if (pieceIds.length > 0 && price !== null) return { ...base, action: 'price', pieceIds, price };
  if (/foto que todavia no se uso/.test(plain(context)) && (price !== null || text.includes(','))) {
    const title = message.split(',')[0].replace(/\d+/g, '').trim();
    return { ...base, action: 'add', title: title || null, price };
  }
  return { ...base, action: 'unknown' };
};
