import { describe, expect, test } from 'vitest';
import { availableCanned, CANNED, playCanned } from '@/sobrino/canned';
import { handle } from '@/sobrino/handle';
import { seedSession } from '@/sobrino/seed';
import type { Session } from '@/sobrino/types';

const ids = (s: Session) => availableCanned(s).map((c) => c.id);

/** Ejecuta un audio grabado como lo hace la API. */
function play(session: Session, id: string): Session {
  return playCanned(session, CANNED.find((c) => c.id === id)!, 1).session;
}
const tapYes = (s: Session) => handle(s, { kind: 'button', label: 'Sí' }, 1).session;

describe('audios grabados', () => {
  test('son siete y cada uno tiene texto para leer', () => {
    expect(CANNED).toHaveLength(7);
    expect(CANNED.every((c) => c.label.length > 10)).toBe(true);
  });

  test('con la muestra se ofrecen agregar, vender, precio, foto y el chiste, pero no deshacer', () => {
    expect(ids(seedSession())).toEqual([
      'agregar-azucarera',
      'agregar-mate',
      'vendi-taza',
      'precio-cuenco',
      'foto-maceta',
      'ravioles',
    ]);
  });

  test('agregar la azucarera la publica a $ 18.000 y deja de ofrecerse', () => {
    const s = play(seedSession(), 'agregar-azucarera');
    expect(s.catalog[0]).toMatchObject({
      id: 'azucarera-azul',
      price: 18000,
      image: '/muestra/azucarera-azul.webp',
    });
    expect(ids(s)).not.toContain('agregar-azucarera');
    expect(ids(s)).toContain('deshacer');
  });

  test('tras vender la taza, ese audio ya no aparece', () => {
    const s = tapYes(play(seedSession(), 'vendi-taza'));
    expect(s.catalog.some((p) => p.id === 'taza-marron')).toBe(false);
    expect(ids(s)).not.toContain('vendi-taza');
  });

  test('cambiar el precio del cuenco lo deja en $ 30.000 y deja de ofrecerse', () => {
    const s = play(seedSession(), 'precio-cuenco');
    expect(s.catalog.find((p) => p.id === 'cuenco')!.price).toBe(30000);
    expect(ids(s)).not.toContain('precio-cuenco');
  });

  test('cambiar la foto de la maceta reemplaza la imagen sin agregar piezas', () => {
    const s = play(seedSession(), 'foto-maceta');
    expect(s.catalog).toHaveLength(8);
    expect(s.catalog.find((p) => p.id === 'maceta')!.image).toBe('/muestra/maceta-nueva.webp');
    expect(ids(s)).not.toContain('foto-maceta');
  });

  test('deshacer vuelve atrás el último cambio y deja de ofrecerse', () => {
    const s = play(play(seedSession(), 'precio-cuenco'), 'deshacer');
    expect(s.catalog.find((p) => p.id === 'cuenco')!.price).toBe(28000);
    expect(ids(s)).not.toContain('deshacer');
  });

  test('con el catálogo vacío solo quedan agregar y el chiste', () => {
    expect(ids({ catalog: [] })).toEqual(['agregar-azucarera', 'agregar-mate', 'ravioles']);
  });

  test('una foto pendiente de otra cosa no se mezcla con un audio de agregar', () => {
    const conFoto = handle(seedSession(), { kind: 'photo', image: '/f/otra.webp' }, 1).session;
    const s = play(conFoto, 'agregar-mate');
    expect(s.catalog[0]).toMatchObject({ id: 'mate-verde', image: '/muestra/mate-verde.webp' });
  });
});
