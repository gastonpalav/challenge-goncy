import * as say from './phrases';
import type { Reply, Session } from './types';

/**
 * El guiño: Goncy hace streams. Si la tía le escribe mientras está en vivo,
 * avisa que está ocupado y hace el cambio igual.
 */

/** Un bloque de stream en hora de Argentina. day: 0 es domingo. from y to: "HH:MM", el mismo día. */
export type Slot = { day: number; from: string; to: string };

/** Horarios de stream. Vacío: el guiño queda apagado. */
export const STREAM_SCHEDULE: Slot[] = [];

/** Argentina no cambia la hora: siempre tres horas menos que UTC. */
const ART_OFFSET = -3 * 60 * 60 * 1000;
/** No lo repite en cada mensaje: una vez por stream alcanza. */
const QUIET = 4 * 60 * 60 * 1000;

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export function isLive(now: number, schedule: Slot[] = STREAM_SCHEDULE): boolean {
  const local = new Date(now + ART_OFFSET);
  const day = local.getUTCDay();
  const minute = local.getUTCHours() * 60 + local.getUTCMinutes();
  return schedule.some((s) => s.day === day && minute >= minutes(s.from) && minute < minutes(s.to));
}

type Result = { session: Session; replies: Reply[] };

/**
 * Si el mensaje cambió la página y Goncy está en vivo, antepone el aviso.
 * Nunca frena ni altera el cambio: solo suma una burbuja.
 */
export function withLiveNote<R extends Result>(before: Session, result: R, now: number, live: boolean): R {
  if (!live || result.session.catalog === before.catalog) return result;
  const last = result.session.liveNoteAt;
  if (last !== undefined && now - last < QUIET) return result;
  return {
    ...result,
    session: { ...result.session, liveNoteAt: now },
    replies: [{ text: say.liveNote() }, ...result.replies],
  };
}
