import { describe, expect, test } from 'vitest';
import { LIMITS, take } from '@/limits';
import { MemoryStore } from '@/store/memory';

describe('cupos', () => {
  test('los valores son los acordados', () => {
    expect(LIMITS).toEqual({
      text: { visitor: 30, global: 2000 },
      audio: { visitor: 5, global: 300 },
      upload: { visitor: 3, global: 200 },
    });
  });

  test('el texto 31 del mismo visitante se rechaza', async () => {
    const store = new MemoryStore();
    for (let i = 0; i < 30; i += 1) expect(await take(store, 'ana', 'text')).toBe(true);
    expect(await take(store, 'ana', 'text')).toBe(false);
  });

  test('otro visitante sigue pudiendo', async () => {
    const store = new MemoryStore();
    for (let i = 0; i < 31; i += 1) await take(store, 'ana', 'text');
    expect(await take(store, 'beto', 'text')).toBe(true);
  });

  test('cada tipo tiene su cupo', async () => {
    const store = new MemoryStore();
    for (let i = 0; i < 5; i += 1) expect(await take(store, 'ana', 'audio')).toBe(true);
    expect(await take(store, 'ana', 'audio')).toBe(false);
    expect(await take(store, 'ana', 'text')).toBe(true);
    for (let i = 0; i < 3; i += 1) expect(await take(store, 'ana', 'upload')).toBe(true);
    expect(await take(store, 'ana', 'upload')).toBe(false);
  });

  test('el tope global corta aunque cada visitante tenga cupo', async () => {
    const store = new MemoryStore();
    const limits = { ...LIMITS, text: { visitor: 30, global: 3 } };
    expect(await take(store, 'a', 'text', limits)).toBe(true);
    expect(await take(store, 'b', 'text', limits)).toBe(true);
    expect(await take(store, 'c', 'text', limits)).toBe(true);
    expect(await take(store, 'd', 'text', limits)).toBe(false);
  });

  test('un visitante sin cupo no consume del tope global', async () => {
    const store = new MemoryStore();
    const limits = { ...LIMITS, text: { visitor: 1, global: 2 } };
    expect(await take(store, 'a', 'text', limits)).toBe(true);
    for (let i = 0; i < 5; i += 1) expect(await take(store, 'a', 'text', limits)).toBe(false);
    expect(await take(store, 'b', 'text', limits)).toBe(true);
  });

  test('al día siguiente el cupo se renueva', async () => {
    let now = Date.UTC(2026, 10, 12, 10);
    const store = new MemoryStore(() => now);
    const limits = { ...LIMITS, text: { visitor: 1, global: 10 } };
    expect(await take(store, 'a', 'text', limits, () => now)).toBe(true);
    expect(await take(store, 'a', 'text', limits, () => now)).toBe(false);
    now += 25 * 3600 * 1000;
    expect(await take(store, 'a', 'text', limits, () => now)).toBe(true);
  });
});
