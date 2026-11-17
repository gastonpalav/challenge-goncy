import { describe, expect, test } from 'vitest';
import { handle } from '@/sobrino/handle';
import { seedSession } from '@/sobrino/seed';
import type { Intent, Message, Reply, Session } from '@/sobrino/types';

const NOW = 1_800_000_000_000;

function base(): Session {
  return {
    catalog: [
      { id: 'taza-marron', title: 'Taza marrón', price: 24000, image: '/m/taza-marron.webp', createdAt: 3 },
      { id: 'taza-azul', title: 'Taza azul', price: 26000, image: '/m/taza-azul.webp', createdAt: 2 },
      { id: 'cuenco', title: 'Cuenco', price: 28000, image: '/m/cuenco.webp', createdAt: 1 },
    ],
  };
}

/** Manda varios mensajes seguidos y devuelve la sesión final y las últimas respuestas. */
function run(session: Session, ...messages: Message[]): { session: Session; replies: Reply[] } {
  let out = { session, replies: [] as Reply[] };
  for (const m of messages) out = handle(out.session, m, NOW);
  return out;
}
const say = (intent: Intent): Message => ({ kind: 'intent', intent });
const photo = (image: string): Message => ({ kind: 'photo', image });
const tap = (label: string): Message => ({ kind: 'button', label });
const lastButtons = (r: Reply[]) => r[r.length - 1]?.buttons;
const allText = (r: Reply[]) => r.map((x) => x.text).join(' ');
const priceOf = (s: Session, id: string) => s.catalog.find((p) => p.id === id)!.price;

describe('agregar', () => {
  test('foto + nombre y precio publica al principio', () => {
    const { session, replies } = run(
      base(),
      photo('/f/azucarera.webp'),
      say({ type: 'add', title: 'Azucarera azul', price: 18000 }),
    );
    expect(session.catalog).toHaveLength(4);
    expect(session.catalog[0]).toMatchObject({
      title: 'Azucarera azul',
      price: 18000,
      image: '/f/azucarera.webp',
      createdAt: NOW,
    });
    expect(allText(replies)).toContain('$ 18.000');
    expect(session.pendingPhoto).toBeUndefined();
    expect(session.draft).toBeUndefined();
  });

  test('nombre y precio antes que la foto también publica', () => {
    const { session } = run(base(), say({ type: 'add', title: 'Florero', price: 30000 }), photo('/f/florero.webp'));
    expect(session.catalog[0]).toMatchObject({ title: 'Florero', price: 30000, image: '/f/florero.webp' });
  });

  test('solo una foto no publica y pregunta', () => {
    const { session, replies } = run(base(), photo('/f/x.webp'));
    expect(session.catalog).toHaveLength(3);
    expect(session.pendingPhoto).toBe('/f/x.webp');
    expect(replies).toHaveLength(1);
    expect(replies[0].text).toMatch(/\?/);
  });

  test('segunda foto reemplaza a la pendiente', () => {
    const { session } = run(base(), photo('/f/primera.webp'), photo('/f/segunda.webp'));
    expect(session.pendingPhoto).toBe('/f/segunda.webp');
    expect(session.catalog).toHaveLength(3);
  });

  test('foto y solo el nombre: guarda el nombre y espera el precio', () => {
    const paso = run(base(), photo('/f/x.webp'), say({ type: 'add', title: 'Florero' }));
    expect(paso.session.catalog).toHaveLength(3);
    const fin = run(paso.session, say({ type: 'add', price: 30000 }));
    expect(fin.session.catalog[0]).toMatchObject({ title: 'Florero', price: 30000 });
  });

  test('un id repetido recibe sufijo', () => {
    const { session } = run(base(), photo('/f/x.webp'), say({ type: 'add', title: 'Cuenco', price: 20000 }));
    const ids = session.catalog.map((p) => p.id);
    expect(session.catalog).toHaveLength(4);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('vender', () => {
  test('pide confirmación y solo saca con Sí', () => {
    const pregunta = run(base(), say({ type: 'sold', pieceIds: ['cuenco'] }));
    expect(pregunta.session.catalog).toHaveLength(3);
    expect(lastButtons(pregunta.replies)).toEqual(['Sí', 'No']);
    expect(pregunta.replies.some((r) => r.image === '/m/cuenco.webp')).toBe(true);

    const no = run(pregunta.session, tap('No'));
    expect(no.session.catalog).toHaveLength(3);

    const si = run(pregunta.session, tap('Sí'));
    expect(si.session.catalog.map((p) => p.id)).toEqual(['taza-marron', 'taza-azul']);
  });

  test('dos tazas: pregunta cuál con botones y no saca ninguna', () => {
    const { session, replies } = run(base(), say({ type: 'sold', pieceIds: ['taza-marron', 'taza-azul'] }));
    expect(session.catalog).toHaveLength(3);
    expect(lastButtons(replies)).toEqual(['Taza marrón', 'Taza azul']);

    const elegida = run(session, tap('Taza azul'));
    expect(elegida.session.catalog).toHaveLength(3);
    expect(lastButtons(elegida.replies)).toEqual(['Sí', 'No']);
    const fin = run(elegida.session, tap('Sí'));
    expect(fin.session.catalog.map((p) => p.id)).toEqual(['taza-marron', 'cuenco']);
  });

  test('dos piezas con el mismo título se distinguen en los botones', () => {
    const s = base();
    s.catalog[1].title = 'Taza marrón';
    const { replies } = run(s, say({ type: 'sold', pieceIds: ['taza-marron', 'taza-azul'] }));
    const b = lastButtons(replies)!;
    expect(new Set(b).size).toBe(2);
    expect(b.every((x) => x.length <= 20)).toBe(true);
  });

  test('títulos largos se recortan a 20 caracteres en los botones', () => {
    const s = base();
    s.catalog[0].title = 'Taza grande con asa doble y esmalte marrón';
    const { replies } = run(s, say({ type: 'sold', pieceIds: ['taza-marron', 'taza-azul'] }));
    expect(lastButtons(replies)!.every((x) => x.length <= 20)).toBe(true);
  });

  test('ninguna pieza coincide: pregunta y no cambia nada', () => {
    const { session, replies } = run(base(), say({ type: 'sold', pieceIds: [] }));
    expect(session.catalog).toHaveLength(3);
    expect(session.pending).toBeUndefined();
    expect(replies[0].text).toMatch(/\?/);
  });

  test('un id que no existe se ignora', () => {
    const { session } = run(base(), say({ type: 'sold', pieceIds: ['no-existe'] }));
    expect(session.pending).toBeUndefined();
    expect(session.catalog).toHaveLength(3);
  });

  test('más de tres coincidencias: pide que sea más específica, sin botones', () => {
    const s = base();
    s.catalog.push({ id: 'taza-verde', title: 'Taza verde', price: 1, image: '', createdAt: 0 });
    const { session, replies } = run(
      s,
      say({ type: 'sold', pieceIds: ['taza-marron', 'taza-azul', 'cuenco', 'taza-verde'] }),
    );
    expect(lastButtons(replies)).toBeUndefined();
    expect(session.pending).toBeUndefined();
  });
});

describe('precio', () => {
  test('cambia el precio y lo repite completo', () => {
    const { session, replies } = run(base(), say({ type: 'price', pieceIds: ['cuenco'], price: 30000 }));
    expect(priceOf(session, 'cuenco')).toBe(30000);
    expect(allText(replies)).toContain('$ 30.000');
  });

  test('precio 18 pregunta si son 18.000', () => {
    const pregunta = run(base(), say({ type: 'price', pieceIds: ['cuenco'], price: 18 }));
    expect(priceOf(pregunta.session, 'cuenco')).toBe(28000);
    expect(allText(pregunta.replies)).toContain('$ 18.000');
    expect(lastButtons(pregunta.replies)).toEqual(['Sí', 'No']);

    const si = run(pregunta.session, tap('Sí'));
    expect(priceOf(si.session, 'cuenco')).toBe(18000);
    const no = run(pregunta.session, tap('No'));
    expect(priceOf(no.session, 'cuenco')).toBe(28000);
  });

  test.each([0, -5, 20_000_000, 1500.5, Number.NaN])('precio %s se rechaza', (price) => {
    const { session, replies } = run(base(), say({ type: 'price', pieceIds: ['cuenco'], price }));
    expect(priceOf(session, 'cuenco')).toBe(28000);
    expect(session.pending).toBeUndefined();
    expect(replies[0].text).toMatch(/\?/);
  });

  test('pieza nueva con precio 15 también pregunta en miles', () => {
    const pregunta = run(base(), photo('/f/x.webp'), say({ type: 'add', title: 'Mate', price: 15 }));
    expect(pregunta.session.catalog).toHaveLength(3);
    const si = run(pregunta.session, tap('Sí'));
    expect(si.session.catalog[0]).toMatchObject({ title: 'Mate', price: 15000 });
  });
});

describe('foto nueva', () => {
  test('foto y después decir de cuál es: reemplaza', () => {
    const { session } = run(base(), photo('/f/nueva.webp'), say({ type: 'photo', pieceIds: ['cuenco'] }));
    expect(session.catalog.find((p) => p.id === 'cuenco')!.image).toBe('/f/nueva.webp');
    expect(session.catalog).toHaveLength(3);
    expect(session.pendingPhoto).toBeUndefined();
  });

  test('decir de cuál es y después la foto: reemplaza', () => {
    const { session } = run(base(), say({ type: 'photo', pieceIds: ['cuenco'] }), photo('/f/nueva.webp'));
    expect(session.catalog.find((p) => p.id === 'cuenco')!.image).toBe('/f/nueva.webp');
    expect(session.catalog).toHaveLength(3);
  });
});

describe('deshacer', () => {
  test('restaura el catálogo anterior una sola vez', () => {
    const cambiado = run(base(), say({ type: 'price', pieceIds: ['cuenco'], price: 30000 }));
    const uno = run(cambiado.session, say({ type: 'undo' }));
    expect(priceOf(uno.session, 'cuenco')).toBe(28000);
    const dos = run(uno.session, say({ type: 'undo' }));
    expect(dos.session.catalog).toEqual(uno.session.catalog);
    expect(dos.replies[0].text).not.toBe(uno.replies[0].text);
  });

  test('deshace una venta', () => {
    const { session } = run(base(), say({ type: 'sold', pieceIds: ['cuenco'] }), tap('Sí'), say({ type: 'undo' }));
    expect(session.catalog).toHaveLength(3);
  });
});

describe('lo demás', () => {
  test('smalltalk no cambia el catálogo', () => {
    const s = base();
    const { session, replies } = run(s, say({ type: 'smalltalk' }));
    expect(session.catalog).toEqual(s.catalog);
    expect(replies).toHaveLength(1);
  });

  test('botón sin pregunta pendiente no rompe ni cambia nada', () => {
    const s = base();
    const { session, replies } = run(s, tap('Sí'));
    expect(session.catalog).toEqual(s.catalog);
    expect(replies).toHaveLength(1);
  });

  test('un mensaje nuevo descarta la pregunta pendiente', () => {
    const { session } = run(
      base(),
      say({ type: 'sold', pieceIds: ['cuenco'] }),
      say({ type: 'smalltalk' }),
      tap('Sí'),
    );
    expect(session.catalog).toHaveLength(3);
  });

  test('no modifica la sesión que recibe', () => {
    const s = base();
    const copia = structuredClone(s);
    run(s, say({ type: 'sold', pieceIds: ['cuenco'] }), tap('Sí'));
    expect(s).toEqual(copia);
  });

  test('como máximo 3 botones de hasta 20 caracteres', () => {
    const { replies } = run(base(), say({ type: 'sold', pieceIds: ['taza-marron', 'taza-azul', 'cuenco'] }));
    const b = lastButtons(replies)!;
    expect(b).toHaveLength(3);
    expect(b.every((x) => x.length <= 20)).toBe(true);
  });
});

describe('muestra', () => {
  test('tiene 11 piezas con ids únicos, sin las que agregan los audios grabados', () => {
    const { catalog } = seedSession();
    const ids = catalog.map((p) => p.id);
    expect(ids).toHaveLength(11);
    expect(new Set(ids).size).toBe(11);
    expect(ids).toEqual(expect.arrayContaining(['taza-marron', 'cuenco', 'maceta']));
    expect(ids).not.toContain('azucarera-azul');
    expect(ids).not.toContain('mate-verde');
  });
});
