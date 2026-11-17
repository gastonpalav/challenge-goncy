import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 320, height: 640 } });

const sinDesborde = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test('tocar una pieza lleva a escribirle a Norma', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Taza marrón/ }).click();
  await expect(page).toHaveURL(/\/consulta\/taza-marron$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Taza marrón' })).toBeVisible();
  await expect(page.getByText('$ 24.000')).toBeVisible();
  expect(await sinDesborde(page)).toBe(true);
});

test('sin nombre no arranca el chat', async ({ page }) => {
  await page.goto('/consulta/taza-marron');
  await page.getByRole('button', { name: 'Escribirle a Norma' }).click();
  await expect(page.getByText('Escribí tu nombre para seguir.')).toBeVisible();
  await expect(page.getByText('la ceramista · en línea')).toHaveCount(0);
});

test('con el nombre sale el mensaje y Norma contesta cada pregunta', async ({ page }) => {
  await page.goto('/consulta/taza-marron');
  await page.getByLabel(/cómo te llamás/).fill('  Marta ');
  await page.getByRole('button', { name: 'Escribirle a Norma' }).click();

  await expect(page.getByText('la ceramista · en línea')).toBeVisible();
  await expect(page.getByText('Hola, Norma, soy Marta. Me gusta esta pieza de tu página: “Taza marrón”, a $ 24.000. ¿Sigue disponible?')).toBeVisible();
  await expect(page.getByText(/todavía la tengo/)).toBeVisible();

  for (const [pregunta, respuesta] of [
    ['¿Hacés envíos?', /envíos no hago/],
    ['¿Puedo pasar por el taller?', /así pongo la pava/],
    ['¿Me guardás la pieza unos días?', /hasta el sábado/],
  ] as const) {
    await page.getByRole('button', { name: pregunta }).click();
    await expect(page.getByText(respuesta)).toBeVisible();
    await expect(page.getByRole('button', { name: pregunta })).toHaveCount(0);
  }

  await expect(page.getByText('Así de fácil se arregla con Norma.')).toBeVisible();
  expect(await sinDesborde(page)).toBe(true);
  await page.getByRole('link', { name: '‹ Volver a las piezas' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('una pieza que ya no está lo dice y deja volver', async ({ page }) => {
  await page.goto('/consulta/no-existe');
  await expect(page.getByRole('heading', { level: 1, name: 'Esa pieza ya no está' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Volver a las piezas/ })).toBeVisible();
});

test('en el simulador las piezas no se tocan', async ({ page }) => {
  await page.goto('/simulador');
  await expect(page.locator('a[href*="consulta"]')).toHaveCount(0);
});
