import { seedSession } from '@/sobrino/seed';
import type { Session } from '@/sobrino/types';
import { MemoryStore } from './memory';

export interface Store {
  getSession(key: string): Promise<Session | null>;
  setSession(key: string, session: Session, ttlSeconds?: number): Promise<void>;
  deleteSession(key: string): Promise<void>;
  /** Suma uno al contador y devuelve el valor nuevo. El vencimiento se fija al crearlo. */
  incr(key: string, ttlSeconds: number): Promise<number>;
}

/** Clave del catálogo real, el que se ve en la página pública. */
export const REAL = 'real';

const globalForStore = globalThis as unknown as { __store?: Store };

/** Un único Store por proceso (en desarrollo, el módulo se recarga pero la memoria no). */
export function getStore(): Store {
  globalForStore.__store ??= new MemoryStore();
  return globalForStore.__store;
}

/** Devuelve la sesión guardada o, si no hay, la crea con el catálogo de muestra. */
export async function loadOrSeed(store: Store, key: string, ttlSeconds?: number): Promise<Session> {
  const saved = await store.getSession(key);
  if (saved) return saved;
  const fresh = seedSession();
  await store.setSession(key, fresh, ttlSeconds);
  return fresh;
}
