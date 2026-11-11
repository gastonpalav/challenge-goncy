import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 320, height: 640 } });

const sinDesborde = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test('muestra el cartel, las piezas y los precios', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Cerámicas de Norma' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Taza marrón' })).toBeVisible();
  await expect(page.getByText('$ 24.000')).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(8);
  expect(await sinDesborde(page)).toBe(true);
});

test('la letra de títulos y precios es de 20 px o más', async ({ page }) => {
  await page.goto('/');
  const px = (name: string | RegExp, level?: number) =>
    (level ? page.getByRole('heading', { level, name }) : page.getByText(name))
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(await px('Taza marrón', 2)).toBeGreaterThanOrEqual(20);
  expect(await px('$ 24.000')).toBeGreaterThanOrEqual(20);
});

test('no enlaza al simulador ni a WhatsApp', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href*="simulador"], a[href*="wa.me"], a[href*="whatsapp"]')).toHaveCount(0);
});

test('título larguísimo y precio de siete cifras no desbordan', async ({ page }) => {
  await page.goto('/prueba/largo');
  await expect(page.getByText('$ 1.250.000')).toBeVisible();
  expect(await sinDesborde(page)).toBe(true);
  // El cartelito queda entero dentro de la pantalla.
  const box = await page.getByText('$ 1.250.000').boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
});

test('sin piezas muestra el cartel del taller', async ({ page }) => {
  await page.goto('/prueba/vacio');
  await expect(page.getByText(/Norma está en el taller/)).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('se lee sin JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 640 } });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 2, name: 'Taza marrón' })).toBeVisible();
  await expect(page.getByText('$ 24.000')).toBeVisible();
  await context.close();
});

test('en pantalla ancha hay tres columnas', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto('/');
  const tops = await page.getByRole('listitem').evaluateAll((els) => els.slice(0, 4).map((e) => e.getBoundingClientRect().top));
  expect(tops[0]).toBe(tops[1]);
  expect(tops[1]).toBe(tops[2]);
  expect(tops[3]).toBeGreaterThan(tops[0]);
  await context.close();
});
