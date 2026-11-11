import { expect, test } from 'vitest';
import { formatPrice } from '@/sobrino/money';

test('formatea con signo, espacio y punto de miles', () => {
  expect(formatPrice(15000)).toBe('$ 15.000');
  expect(formatPrice(1250000)).toBe('$ 1.250.000');
  expect(formatPrice(900)).toBe('$ 900');
});
