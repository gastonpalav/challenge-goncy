import { describe, expect, test } from 'vitest';
import { loadOrSeed } from '@/store';
import { MemoryStore } from '@/store/memory';
import { seedSession } from '@/sobrino/seed';

describe('MemoryStore', () => {
  test('devuelve null si no hay sesión', async () => {
    expect(await new MemoryStore().getSession('x')).toBeNull();
  });

  test('guarda y devuelve una copia, no la misma referencia', async () => {
    const store = new MemoryStore();
    const s = seedSession();
    await store.setSession('x', s);
    const leida = await store.getSession('x');
    expect(leida).toEqual(s);
    leida!.catalog.pop();
    expect((await store.getSession('x'))!.catalog).toHaveLength(8);
  });

  test('una sesión vencida deja de existir', async () => {
    let now = 1000;
    const store = new MemoryStore(() => now);
    await store.setSession('x', seedSession(), 10);
    now += 11_000;
    expect(await store.getSession('x')).toBeNull();
  });

  test('incr cuenta desde 1 y se reinicia al vencer', async () => {
    let now = 1000;
    const store = new MemoryStore(() => now);
    expect(await store.incr('c', 60)).toBe(1);
    expect(await store.incr('c', 60)).toBe(2);
    now += 61_000;
    expect(await store.incr('c', 60)).toBe(1);
  });
});

describe('loadOrSeed', () => {
  test('sin sesión devuelve la muestra y la deja guardada', async () => {
    const store = new MemoryStore();
    const s = await loadOrSeed(store, 'real');
    expect(s.catalog).toHaveLength(8);
    expect(await store.getSession('real')).toEqual(s);
  });

  test('con sesión guardada devuelve esa, aunque esté vacía', async () => {
    const store = new MemoryStore();
    await store.setSession('real', { catalog: [] });
    expect((await loadOrSeed(store, 'real')).catalog).toEqual([]);
  });
});
