import { formatPrice } from './money';

/**
 * Todo lo que dice el sobrino. Frases escritas a mano: el modelo nunca redacta.
 * Tono: sobrino que quiere a la tía, de vos, corto, sin emojis.
 */

export const YES = 'Sí';
export const NO = 'No';

export const hello = () => 'Hola, tía. Mandame la foto de una pieza nueva, o contame qué vendiste.';
export const connectionLost = () => 'Se me cortó la señal, tía. Probá de nuevo en un ratito.';

export const published =(title: string, price: number) =>
  `Listo tía, ya está en la página: ${title}, ${formatPrice(price)}.`;

export const askNameAndPrice = () => 'Qué linda, tía. ¿Cómo se llama y cuánto sale?';
export const askName = () => '¿Y qué nombre le ponemos, tía?';
export const askPrice = () => '¿Y a cuánto la ponemos, tía?';
export const askPhoto = () => 'Dale, tía. Mandame la foto y la subo.';

export const confirmSold = () => '¿Esta vendiste, tía?';
export const sold = () => 'Felicitaciones, tía. Ya la saqué de la página.';
export const notSold = () => 'Ah, perdón. No toqué nada.';

export const confirmPrice = (price: number) => `¿${formatPrice(price)}, tía?`;
export const badPrice = () => 'No te entendí el precio, tía. ¿Me lo decís de nuevo?';
export const priceChanged = (title: string, price: number) =>
  `Hecho, tía. ${title} ahora sale ${formatPrice(price)}.`;
export const askNewPrice = (title: string) => `¿A cuánto ponemos "${title}", tía?`;

export const photoChanged = (title: string) => `Listo, tía. Ya cambié la foto de "${title}".`;
export const askNewPhoto = (title: string) => `Dale. Mandame la foto nueva de "${title}".`;

export const whichOne = () => '¿Cuál de estas, tía?';
export const notFound = () => 'No encontré esa pieza en la página, tía. ¿Cuál es?';
export const beMoreSpecific = () => 'Tenés varias parecidas, tía. ¿Me decís bien cuál?';

export const undone = () => 'Listo, tía. Lo dejé como estaba antes.';
export const nothingToUndo = () => 'No hay nada para deshacer, tía. Está todo como lo dejaste.';

export const smalltalk = () => 'Dale, tía, el domingo paso a verte. ¿Alguna novedad con las piezas?';
export const notUnderstood = () =>
  'No te entendí, tía. Mandame la foto de una pieza, o decime cuál vendiste o cuál cambió de precio.';

export const outOfCredit = () =>
  'Tía, por hoy me quedé sin crédito para leer mensajes. Tocá uno de los audios de abajo, que esos me llegan igual.';
export const micFailed = () => 'No te escuché bien, tía. ¿Me lo escribís o me mandás uno de los audios de abajo?';
