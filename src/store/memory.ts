import type { Session } from '@/sobrino/types';
import type { Store } from './index';

type Entry<T> = { value: T; expiresAt?: number };

/** Store en memoria, para tests y para desarrollo sin Redis. */
export class MemoryStore implements Store {
  private sessions = new Map<string, Entry<string>>();
  private counters = new Map<string, Entry<number>>();

  constructor(private now: () => number = Date.now) {}

  private alive<T>(map: Map<string, Entry<T>>, key: string): Entry<T> | undefined {
    const entry = map.get(key);
    if (entry?.expiresAt !== undefined && entry.expiresAt <= this.now()) {
      map.delete(key);
      return undefined;
    }
    return entry;
  }

  async getSession(key: string): Promise<Session | null> {
    const entry = this.alive(this.sessions, key);
    return entry ? (JSON.parse(entry.value) as Session) : null;
  }

  async setSession(key: string, session: Session, ttlSeconds?: number): Promise<void> {
    this.sessions.set(key, {
      value: JSON.stringify(session),
      expiresAt: ttlSeconds ? this.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async deleteSession(key: string): Promise<void> {
    this.sessions.delete(key);
  }

  async incr(key: string, ttlSeconds: number): Promise<number> {
    const entry = this.alive(this.counters, key);
    if (entry) {
      entry.value += 1;
      return entry.value;
    }
    this.counters.set(key, { value: 1, expiresAt: this.now() + ttlSeconds * 1000 });
    return 1;
  }
}
