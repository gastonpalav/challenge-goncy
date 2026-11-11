import { isValidPrice } from './money';
import * as say from './phrases';
import type { Intent, Message, Piece, Reply, Session } from './types';

type Result = { session: Session; replies: Reply[] };

const MAX_BUTTONS = 3;
const MAX_BUTTON_LENGTH = 20;

/**
 * El sobrino: recibe lo que mandó Norma y decide qué cambia y qué contesta.
 * Función pura: no toca red ni disco, y no modifica la sesión que recibe.
 */
export function handle(session: Session, message: Message, now: number): Result {
  if (message.kind === 'button') return onButton(session, message.label, now);
  // Un mensaje nuevo descarta cualquier pregunta que hubiera quedado abierta.
  const fresh: Session = { ...session, pending: undefined };
  if (message.kind === 'photo') return onPhoto(fresh, message.image, now);
  return onIntent(fresh, message.intent, now);
}

function onButton(session: Session, label: string, now: number): Result {
  const { pending } = session;
  const rest: Session = { ...session, pending: undefined };
  if (!pending) return { session: rest, replies: [{ text: say.notUnderstood() }] };

  if (pending.type === 'choosePiece') {
    const option = pending.options.find((o) => o.label === label);
    if (!option) return { session: rest, replies: [{ text: say.notUnderstood() }] };
    return onIntent(rest, { ...pending.then, pieceIds: [option.id] } as Intent, now);
  }

  if (label !== say.YES && label !== say.NO) {
    return { session: rest, replies: [{ text: say.notUnderstood() }] };
  }

  if (pending.type === 'confirmSold') {
    if (label === say.NO) return { session: rest, replies: [{ text: say.notSold() }] };
    const catalog = rest.catalog.filter((p) => p.id !== pending.pieceId);
    return { session: change(rest, catalog), replies: [{ text: say.sold() }] };
  }

  // confirmPrice
  if (label === say.NO) return { session: rest, replies: [{ text: say.badPrice() }] };
  return onIntent(rest, { ...pending.then, price: pending.price } as Intent, now);
}

function onPhoto(session: Session, image: string, now: number): Result {
  const target = session.photoFor && session.catalog.find((p) => p.id === session.photoFor);
  if (target) {
    return replacePhoto({ ...session, photoFor: undefined }, target, image);
  }
  const next: Session = { ...session, photoFor: undefined, pendingPhoto: image };
  return tryPublish(next, now);
}

function onIntent(session: Session, intent: Intent, now: number): Result {
  switch (intent.type) {
    case 'add':
      return onAdd(session, intent, now);
    case 'sold':
      return withPiece(session, intent, (piece) => ({
        session: { ...session, pending: { type: 'confirmSold', pieceId: piece.id } },
        replies: [{ text: say.confirmSold(), image: piece.image, buttons: [say.YES, say.NO] }],
      }));
    case 'price':
      return withPiece(session, intent, (piece) => onPrice(session, piece, intent.price));
    case 'photo':
      return withPiece(session, intent, (piece) => {
        if (session.pendingPhoto) {
          return replacePhoto({ ...session, pendingPhoto: undefined }, piece, session.pendingPhoto);
        }
        return {
          session: { ...session, photoFor: piece.id },
          replies: [{ text: say.askNewPhoto(piece.title) }],
        };
      });
    case 'undo':
      if (!session.previous) return { session, replies: [{ text: say.nothingToUndo() }] };
      return {
        session: { ...session, catalog: session.previous, previous: undefined },
        replies: [{ text: say.undone() }],
      };
    case 'smalltalk':
      return { session, replies: [{ text: say.smalltalk() }] };
    default:
      return { session, replies: [{ text: say.notUnderstood() }] };
  }
}

function onAdd(session: Session, intent: Extract<Intent, { type: 'add' }>, now: number): Result {
  const title = intent.title?.trim() || session.draft?.title;
  let price = session.draft?.price;

  if (intent.price !== undefined) {
    const check = checkPrice(intent.price);
    if (check === 'bad') {
      return { session: { ...session, draft: clean({ title, price }) }, replies: [{ text: say.badPrice() }] };
    }
    if (check === 'thousands') {
      const asked = intent.price * 1000;
      return {
        session: {
          ...session,
          draft: clean({ title, price }),
          pending: { type: 'confirmPrice', price: asked, then: { type: 'add' } },
        },
        replies: [{ text: say.confirmPrice(asked), buttons: [say.YES, say.NO] }],
      };
    }
    price = intent.price;
  }

  return tryPublish({ ...session, draft: clean({ title, price }) }, now);
}

/** Publica si ya están la foto, el nombre y el precio; si no, pregunta por lo que falta. */
function tryPublish(session: Session, now: number): Result {
  const { pendingPhoto, draft } = session;
  const title = draft?.title;
  const price = draft?.price;

  if (pendingPhoto && title && price !== undefined) {
    const piece: Piece = {
      id: uniqueId(title, session.catalog),
      title,
      price,
      image: pendingPhoto,
      createdAt: now,
    };
    const next = change({ ...session, pendingPhoto: undefined, draft: undefined }, [piece, ...session.catalog]);
    return { session: next, replies: [{ text: say.published(title, price) }] };
  }

  let question: string;
  if (!pendingPhoto) question = say.askPhoto();
  else if (!title && price === undefined) question = say.askNameAndPrice();
  else if (!title) question = say.askName();
  else question = say.askPrice();
  return { session, replies: [{ text: question }] };
}

function onPrice(session: Session, piece: Piece, price: number | undefined): Result {
  if (price === undefined) return { session, replies: [{ text: say.askNewPrice(piece.title) }] };
  const check = checkPrice(price);
  if (check === 'bad') return { session, replies: [{ text: say.badPrice() }] };
  if (check === 'thousands') {
    const asked = price * 1000;
    return {
      session: {
        ...session,
        pending: { type: 'confirmPrice', price: asked, then: { type: 'price', pieceIds: [piece.id] } },
      },
      replies: [{ text: say.confirmPrice(asked), buttons: [say.YES, say.NO] }],
    };
  }
  const catalog = session.catalog.map((p) => (p.id === piece.id ? { ...p, price } : p));
  return { session: change(session, catalog), replies: [{ text: say.priceChanged(piece.title, price) }] };
}

function replacePhoto(session: Session, piece: Piece, image: string): Result {
  const catalog = session.catalog.map((p) => (p.id === piece.id ? { ...p, image } : p));
  return { session: change(session, catalog), replies: [{ text: say.photoChanged(piece.title) }] };
}

/**
 * Resuelve de qué pieza habla Norma. Con una sola, sigue. Con dos o tres, pregunta
 * con botones. Con ninguna o con demasiadas, pide que lo aclare. Nunca adivina.
 */
function withPiece(
  session: Session,
  intent: Extract<Intent, { pieceIds: string[] }>,
  proceed: (piece: Piece) => Result,
): Result {
  const wanted = new Set(intent.pieceIds);
  const matches = session.catalog.filter((p) => wanted.has(p.id));

  if (matches.length === 0) return { session, replies: [{ text: say.notFound() }] };
  if (matches.length === 1) return proceed(matches[0]);
  if (matches.length > MAX_BUTTONS) return { session, replies: [{ text: say.beMoreSpecific() }] };

  const labels = buttonLabels(matches.map((p) => p.title));
  const options = matches.map((p, i) => ({ id: p.id, label: labels[i] }));
  const photos: Reply[] = matches.map((p, i) => ({ text: labels[i], image: p.image }));
  return {
    session: { ...session, pending: { type: 'choosePiece', options, then: intent } },
    replies: [...photos, { text: say.whichOne(), buttons: labels }],
  };
}

function checkPrice(price: number): 'ok' | 'thousands' | 'bad' {
  if (!isValidPrice(price)) return 'bad';
  return price < 1000 ? 'thousands' : 'ok';
}

/** Guarda el catálogo anterior para poder deshacer. */
function change(session: Session, catalog: Piece[]): Session {
  return { ...session, catalog, previous: session.catalog };
}

function clean(draft: { title?: string; price?: number }): Session['draft'] {
  if (!draft.title && draft.price === undefined) return undefined;
  return draft;
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Etiquetas de botón de hasta 20 caracteres y sin repetidos. */
function buttonLabels(titles: string[]): string[] {
  const plain = titles.map((t) => truncate(t, MAX_BUTTON_LENGTH));
  if (new Set(plain).size === plain.length) return plain;
  return titles.map((t, i) => `${i + 1}. ${truncate(t, MAX_BUTTON_LENGTH - 3)}`);
}

export function slugify(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'pieza';
}

function uniqueId(title: string, catalog: Piece[]): string {
  const taken = new Set(catalog.map((p) => p.id));
  const baseId = slugify(title);
  if (!taken.has(baseId)) return baseId;
  let n = 2;
  while (taken.has(`${baseId}-${n}`)) n += 1;
  return `${baseId}-${n}`;
}
