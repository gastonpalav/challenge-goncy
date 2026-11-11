import { Redis } from '@upstash/redis';
import type { Session } from '@/sobrino/types';
import type { Store } from './index';

/** Variables que deja la integración de Upstash en Vercel (según cómo se haya conectado). */
export function redisEnv(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

/** Store en Upstash Redis, para producción. */
export class RedisStore implements Store {
  private redis: Redis;

  constructor(env: { url: string; token: string }, private prefix = 'norma:') {
    this.redis = new Redis(env);
  }

  async getSession(key: string): Promise<Session | null> {
    return (await this.redis.get<Session>(this.prefix + key)) ?? null;
  }

  async setSession(key: string, session: Session, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) await this.redis.set(this.prefix + key, session, { ex: ttlSeconds });
    else await this.redis.set(this.prefix + key, session);
  }

  async deleteSession(key: string): Promise<void> {
    await this.redis.del(this.prefix + key);
  }

  async incr(key: string, ttlSeconds: number): Promise<number> {
    const value = await this.redis.incr(this.prefix + key);
    // El vencimiento se fija solo la primera vez, así la ventana no se corre con cada uso.
    if (value === 1) await this.redis.expire(this.prefix + key, ttlSeconds);
    return value;
  }
}
