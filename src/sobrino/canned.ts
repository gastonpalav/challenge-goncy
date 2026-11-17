import { handle } from "./handle";
import type { Intent, Message, Reply, Session } from "./types";

/**
 * Los audios de Norma ya grabados que ofrece el simulador.
 * Cada uno trae resuelto qué significa, así que no pasa por ningún modelo:
 * no cuesta nada y no puede entenderse mal.
 */
export type Canned = {
  id: string;
  /** Lo que dice Norma en el audio. Se muestra como texto junto al audio. */
  label: string;
  /** Archivo de audio con la voz de Norma. */
  audio?: string;
  /** Foto que Norma manda junto con el audio. */
  photo?: string;
  intent: Intent;
  /** Si tiene sentido ofrecerlo con el catálogo como está. */
  available: (session: Session) => boolean;
};

const has = (session: Session, id: string) =>
  session.catalog.some((p) => p.id === id);
const piece = (session: Session, id: string) =>
  session.catalog.find((p) => p.id === id);

const NEW_MACETA_PHOTO = "/muestra/maceta-nueva.webp";

export const CANNED: Canned[] = [
  {
    id: "agregar-azucarera",
    label:
      "Goncy, mirá qué linda me quedó la azucarera azul. Ponela a quince mil... no, pará, dieciocho, que el esmalte está carísimo.",
    audio: "/audios/agregar-azucarera.mp3",
    photo: "/muestra/azucarera-azul.webp",
    intent: { type: "add", title: "Azucarera azul", price: 18000 },
    available: (s) => !has(s, "azucarera-azul"),
  },
  {
    id: "agregar-mate",
    label:
      "Este es el mate, el del esmalte verde. Veinticinco mil, y decí que no le cobro la yerba.",
    audio: "/audios/agregar-mate.mp3",
    photo: "/muestra/mate-verde.webp",
    intent: { type: "add", title: "Mate verde", price: 25000 },
    available: (s) => !has(s, "mate-verde"),
  },
  {
    id: "vendi-taza",
    label:
      "Nene, ¡vendí la taza marrón! Se la llevó la Marta, que siempre dice que va a comprar y nunca compra.",
    audio: "/audios/vendi-taza.mp3",
    intent: { type: "sold", pieceIds: ["taza-marron"] },
    available: (s) => has(s, "taza-marron"),
  },
  {
    id: "precio-cuenco",
    label:
      "El cuenco ponelo a treinta mil, que me costó un montón hacerlo. Y si no se vende, me lo quedo yo.",
    audio: "/audios/precio-cuenco.mp3",
    intent: { type: "price", pieceIds: ["cuenco"], price: 30000 },
    available: (s) => {
      const cuenco = piece(s, "cuenco");
      return cuenco !== undefined && cuenco.price !== 30000;
    },
  },
  {
    id: "foto-maceta",
    label:
      "Le saqué otra foto a la maceta, que la otra salió oscura. Poné esta, mi amor.",
    audio: "/audios/foto-maceta.mp3",
    photo: NEW_MACETA_PHOTO,
    intent: { type: "photo", pieceIds: ["maceta"] },
    available: (s) => {
      const maceta = piece(s, "maceta");
      return maceta !== undefined && maceta.image !== NEW_MACETA_PHOTO;
    },
  },
  {
    id: "deshacer",
    label:
      "Ay no, me equivoqué, esa no era. Perdoname, nene, viste cómo soy con este aparato.",
    audio: "/audios/deshacer.mp3",
    intent: { type: "undo" },
    available: (s) => s.previous !== undefined,
  },
  {
    id: "ravioles",
    label:
      "¿Comiste? Venite el domingo que hago ravioles. Y traete un paraguas, que dan lluvia.",
    audio: "/audios/ravioles.mp3",
    intent: { type: "smalltalk" },
    available: () => true,
  },
];

export function availableCanned(session: Session): Canned[] {
  return CANNED.filter((c) => c.available(session));
}

/**
 * Manda un audio grabado al sobrino. Antes descarta lo que hubiera quedado a medio
 * hacer (una foto suelta, una pregunta abierta), para que no se mezcle con el audio.
 */
export function playCanned(
  session: Session,
  canned: Canned,
  now: number,
): { session: Session; replies: Reply[] } {
  const clean: Session = {
    catalog: session.catalog,
    previous: session.previous,
    liveNoteAt: session.liveNoteAt,
  };
  const messages: Message[] = [];
  if (canned.photo) messages.push({ kind: "photo", image: canned.photo });
  messages.push({ kind: "intent", intent: canned.intent });

  let result = { session: clean, replies: [] as Reply[] };
  for (const message of messages) result = handle(result.session, message, now);
  return result;
}
