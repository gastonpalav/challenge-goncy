import type { Store } from '@/store';

/** Lo que cuesta plata en el simulador público. */
export type Kind = 'text' | 'audio' | 'upload';

type Limit = { visitor: number; global: number };

/** Cupos por día: por visitante y para todos los visitantes juntos. */
export const LIMITS: Record<Kind, Limit> = {
  text: { visitor: 30, global: 2000 },
  audio: { visitor: 30, global: 1500 },
  upload: { visitor: 3, global: 200 },
};

const DAY_SECONDS = 86_400;

/**
 * Pide permiso para gastar una unidad. Devuelve false si el visitante agotó su cupo
 * del día o si se llegó al tope global. Quien llama no debe gastar si recibe false.
 */
export async function take(
  store: Store,
  visitor: string,
  kind: Kind,
  limits: Record<Kind, Limit> = LIMITS,
  now: () => number = Date.now,
): Promise<boolean> {
  const day = new Date(now()).toISOString().slice(0, 10);
  const mine = await store.incr(`cupo:${kind}:${day}:v:${visitor}`, DAY_SECONDS);
  if (mine > limits[kind].visitor) return false;
  const everyone = await store.incr(`cupo:${kind}:${day}:todos`, DAY_SECONDS);
  return everyone <= limits[kind].global;
}
