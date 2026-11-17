import { expect, test } from '@playwright/test';

// Capturas para mirar a ojo. No comprueban nada más que llegar a cada pantalla.
const DIR = process.env.CAPTURAS ?? 'test-results/capturas';

test.skip(!process.env.CAPTURA, 'solo a pedido');

test.use({ viewport: { width: 390, height: 780 } });

test('capturas de la consulta en celular', async ({ page }) => {
  const errores: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errores.push(m.text());
  });

  await page.goto('/');
  await page.getByRole('heading', { level: 2, name: 'Taza marrón' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${DIR}/1-pagina.png` });

  await page.goto('/consulta/cuenco');
  // La captura esconde el cursor tocando el campo: si se saca antes de hidratar, React lo ve distinto.
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${DIR}/2-nombre.png` });

  await page.getByLabel(/cómo te llamás/).fill('Marta');
  await page.getByRole('button', { name: 'Escribirle a Norma' }).click();
  await expect(page.getByText(/todavía la tengo/)).toBeVisible();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${DIR}/3-chat.png` });

  for (const pregunta of ['¿Hacés envíos?', '¿Puedo pasar por el taller?', '¿Me guardás la pieza unos días?']) {
    await page.getByRole('button', { name: pregunta }).click();
    await expect(page.getByRole('button', { name: pregunta })).toHaveCount(0);
    await page.waitForTimeout(1800);
  }
  await page.screenshot({ path: `${DIR}/4-final.png` });

  // Los cuatro audios cargan: ninguno cayó al modo "solo texto".
  await expect(page.getByRole('button', { name: /Escuchar|Pausar/ })).toHaveCount(4);
  expect(errores).toEqual([]);
});
