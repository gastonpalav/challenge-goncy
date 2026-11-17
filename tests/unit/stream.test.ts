import { describe, expect, test } from 'vitest';
import * as say from '@/sobrino/phrases';
import { isLive, withLiveNote, type Slot } from '@/sobrino/stream';
import type { Piece, Session } from '@/sobrino/types';

// Martes de 18 a 20, hora de Argentina (UTC-3).
const schedule: Slot[] = [{ day: 2, from: '18:00', to: '20:00' }];
const at = (iso: string) => Date.parse(iso);

describe('isLive', () => {
  test('dentro del horario, en hora de Argentina', () => {
    expect(isLive(at('2026-11-17T18:00:00-03:00'), schedule)).toBe(true);
    expect(isLive(at('2026-11-17T19:59:00-03:00'), schedule)).toBe(true);
  });

  test('fuera del horario o en otro día', () => {
    expect(isLive(at('2026-11-17T17:59:00-03:00'), schedule)).toBe(false);
    expect(isLive(at('2026-11-17T20:00:00-03:00'), schedule)).toBe(false);
    expect(isLive(at('2026-11-18T18:30:00-03:00'), schedule)).toBe(false);
  });

  test('el día se cuenta en Argentina, no en UTC', () => {
    // Lunes 22:00 en Argentina ya es martes en UTC.
    expect(isLive(at('2026-11-16T22:00:00-03:00'), [{ day: 2, from: '00:00', to: '23:59' }])).toBe(false);
  });

  test('sin horarios cargados nunca está en vivo', () => {
    expect(isLive(at('2026-11-17T18:30:00-03:00'), [])).toBe(false);
  });
});

describe('withLiveNote', () => {
  const NOW = at('2026-11-17T18:30:00-03:00');
  const piece: Piece = { id: 'cuenco', title: 'Cuenco', price: 28000, image: '/m/cuenco.webp', createdAt: 1 };
  const before: Session = { catalog: [piece] };
  const changed = { session: { catalog: [] } as Session, replies: [{ text: say.sold() }] };

  test('en vivo y con un cambio: avisa primero y el cambio se hace igual', () => {
    const out = withLiveNote(before, changed, NOW, true);
    expect(out.replies.map((r) => r.text)).toEqual([say.liveNote(), say.sold()]);
    expect(out.session.catalog).toEqual([]);
  });

  test('si no cambió nada, no dice nada', () => {
    const same = { session: before, replies: [{ text: say.smalltalk() }] };
    expect(withLiveNote(before, same, NOW, true)).toBe(same);
  });

  test('fuera del stream no dice nada', () => {
    expect(withLiveNote(before, changed, NOW, false)).toBe(changed);
  });

  test('no lo repite en el mismo stream, sí en el siguiente', () => {
    const first = withLiveNote(before, changed, NOW, true);
    const again = { session: { ...first.session, catalog: [piece] }, replies: [{ text: say.undone() }] };
    const soon = withLiveNote(first.session, again, NOW + 60_000, true);
    expect(soon.replies).toHaveLength(1);
    const nextWeek = withLiveNote(first.session, again, NOW + 7 * 24 * 60 * 60 * 1000, true);
    expect(nextWeek.replies[0].text).toBe(say.liveNote());
  });
});
