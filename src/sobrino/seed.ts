import type { Piece, Session } from "./types";

/**
 * Catálogo de muestra. Los ids son fijos porque los audios grabados los nombran.
 * No incluye 'azucarera-azul' ni 'mate-verde': esas las agrega el visitante.
 */
const PIECES: Omit<Piece, "createdAt" | "image">[] = [
  { id: "taza-marron", title: "Taza marrón", price: 24000 },
  { id: "cuenco", title: "Cuenco", price: 28000 },
  { id: "maceta", title: "Maceta", price: 32000 },
  { id: "jarra", title: "Jarra", price: 45000 },
  { id: "plato-hondo", title: "Plato hondo", price: 22000 },
  { id: "florero", title: "Florero", price: 38000 },
  { id: "tazon", title: "Tazón", price: 26000 },
  { id: "portasahumerio", title: "Portasahumerio", price: 14500 },
  { id: "yerbera", title: "Yerbera", price: 34000 },
  { id: "plato-playo", title: "Plato playo", price: 20000 },
  { id: "jarrito", title: "Jarrito", price: 16000 },
];

const SEED_TIME = Date.UTC(2026, 10, 1);

export function seedSession(): Session {
  return {
    catalog: PIECES.map((p, i) => ({
      ...p,
      image: `/muestra/${p.id}.webp`,
      // La primera de la lista es la más nueva.
      createdAt: SEED_TIME - i * 86_400_000,
    })),
  };
}
