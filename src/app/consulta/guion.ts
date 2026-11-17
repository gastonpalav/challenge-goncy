import { formatPrice } from '@/sobrino/money';
import type { Piece } from '@/sobrino/types';

/**
 * El chat de muestra entre quien quiere una pieza y Norma. Todo está escrito de antemano:
 * no pasa por ningún modelo, así que Norma nunca promete algo que no dijo.
 * Los audios no nombran a la persona ni a la pieza, para servir con cualquiera.
 */
export type Respuesta = { text: string; audio: string };

export type Pregunta = { id: string; label: string; respuesta: Respuesta };

export const SALUDO: Respuesta = {
  text: '¡Hola, mi amor! Sí, todavía la tengo. Esa la hice yo con estas manos, eh. Preguntame lo que quieras.',
  audio: '/audios/norma-saludo.mp3',
};

export const PREGUNTAS: Pregunta[] = [
  {
    id: 'envios',
    label: '¿Hacés envíos?',
    respuesta: {
      text: 'Ay, envíos no hago, querido, que el correo me rompe todo. Pero si sos de cerca, arreglamos.',
      audio: '/audios/norma-envios.mp3',
    },
  },
  {
    id: 'buscar',
    label: '¿Puedo pasar por el taller?',
    respuesta: {
      text: '¡Claro! Pasá por el taller cuando quieras. Avisame antes, así pongo la pava.',
      audio: '/audios/norma-buscar.mp3',
    },
  },
  {
    id: 'guardar',
    label: '¿Me guardás la pieza unos días?',
    respuesta: {
      text: 'Te la guardo hasta el sábado. Después no prometo nada, que la Marta anda dando vueltas.',
      audio: '/audios/norma-guardar.mp3',
    },
  },
];

export const NOMBRE_MAX = 30;

/** El primer mensaje, que sale solo con el nombre de la persona y la pieza que tocó. */
export function primerMensaje(nombre: string, piece: Piece): string {
  return `Hola, Norma, soy ${nombre}. Me gusta esta pieza de tu página: “${piece.title}”, a ${formatPrice(piece.price)}. ¿Sigue disponible?`;
}
