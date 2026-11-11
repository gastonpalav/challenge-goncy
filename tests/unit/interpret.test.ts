import { describe, expect, test } from 'vitest';
import { interpret, toIntent, type Asker } from '@/sobrino/interpret';
import { seedSession } from '@/sobrino/seed';

const session = seedSession();
const answering =
  (raw: unknown): Asker =>
  async () =>
    raw;

describe('toIntent', () => {
  test('agregar con nombre y precio', () => {
    expect(toIntent({ action: 'add', title: ' florero  azul ', price: 30000, pieceIds: [] }, session.catalog)).toEqual({
      type: 'add',
      title: 'Florero azul',
      price: 30000,
    });
  });

  test('agregar sin datos deja los campos sin definir', () => {
    expect(toIntent({ action: 'add', title: null, price: null, pieceIds: [] }, session.catalog)).toEqual({
      type: 'add',
    });
  });

  test('vender conserva solo ids que existen, sin repetir', () => {
    expect(
      toIntent(
        { action: 'sold', title: null, price: null, pieceIds: ['cuenco', 'inventada', 'cuenco'] },
        session.catalog,
      ),
    ).toEqual({ type: 'sold', pieceIds: ['cuenco'] });
  });

  test('precio lleva pieza y precio', () => {
    expect(toIntent({ action: 'price', title: null, price: 20000, pieceIds: ['maceta'] }, session.catalog)).toEqual({
      type: 'price',
      pieceIds: ['maceta'],
      price: 20000,
    });
  });

  test('un título larguísimo se recorta a 60 caracteres', () => {
    const intent = toIntent({ action: 'add', title: 'a'.repeat(200), price: 1000, pieceIds: [] }, session.catalog);
    expect(intent.type === 'add' && intent.title!.length).toBe(60);
  });

  test.each([null, 'hola', 42, {}, { action: 'borrar-todo' }, { action: 'sold' }, { action: 'add', title: 5 }])(
    'una salida inválida (%j) se vuelve unknown',
    (raw) => {
      expect(toIntent(raw, session.catalog)).toEqual({ type: 'unknown' });
    },
  );
});

describe('interpret', () => {
  test('devuelve la intención que respondió el modelo', async () => {
    const ask = answering({ action: 'sold', title: null, price: null, pieceIds: ['taza-marron'] });
    expect(await interpret('vendí la taza marrón', session, { ask })).toEqual({
      type: 'sold',
      pieceIds: ['taza-marron'],
    });
  });

  test('si el modelo falla, devuelve unknown en vez de romper', async () => {
    const ask: Asker = async () => {
      throw new Error('sin red');
    };
    expect(await interpret('hola', session, { ask })).toEqual({ type: 'unknown' });
  });

  test('un texto vacío no llama al modelo', async () => {
    let calls = 0;
    const ask: Asker = async () => {
      calls += 1;
      return null;
    };
    expect(await interpret('   ', session, { ask })).toEqual({ type: 'unknown' });
    expect(calls).toBe(0);
  });

  test('le pasa al modelo el catálogo y lo que quedó pendiente', async () => {
    let seen = '';
    const ask: Asker = async (request) => {
      seen = request.context;
      return { action: 'unknown', title: null, price: null, pieceIds: [] };
    };
    await interpret('florero, treinta mil', { ...session, pendingPhoto: '/f/x.webp' }, { ask });
    expect(seen).toContain('taza-marron');
    expect(seen).toMatch(/foto/i);
  });
});
