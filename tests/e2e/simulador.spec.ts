import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 900 } });

const copia = (page: Page) => page.getByRole('region', { name: /copia de prueba/i });
const chat = (page: Page) => page.getByRole('region', { name: /chat con goncy/i });
const audio = (page: Page, nombre: RegExp) => page.getByRole('button', { name: nombre });

test.beforeEach(async ({ page }) => {
  await page.goto('/simulador');
  await expect(copia(page).getByRole('listitem')).toHaveCount(8);
});

test('se presenta como el chat con Goncy, el sobrino', async ({ page }) => {
  await expect(chat(page).getByText('Goncy', { exact: true })).toBeVisible();
  await expect(chat(page).getByText(/el sobrino/i)).toBeVisible();
});

test('agregar: el audio de la azucarera la publica a $ 18.000', async ({ page }) => {
  await audio(page, /azucarera/i).click();
  await expect(copia(page).getByText('$ 18.000')).toBeVisible();
  await expect(copia(page).getByRole('listitem')).toHaveCount(9);
  await expect(chat(page).getByText(/ya está en la página/i)).toBeVisible();
  await expect(audio(page, /azucarera/i)).toHaveCount(0);
});

test('vender: pide confirmación y con Sí la saca', async ({ page }) => {
  await audio(page, /vendí la taza/i).click();
  await expect(chat(page).getByText('¿Esta vendiste, tía?')).toBeVisible();
  await expect(copia(page).getByRole('heading', { name: 'Taza marrón' })).toBeVisible();
  await chat(page).getByRole('button', { name: 'Sí', exact: true }).click();
  await expect(copia(page).getByRole('heading', { name: 'Taza marrón' })).toHaveCount(0);
  await expect(copia(page).getByRole('listitem')).toHaveCount(7);
});

test('vender: con No no cambia nada', async ({ page }) => {
  await audio(page, /vendí la taza/i).click();
  await chat(page).getByRole('button', { name: 'No', exact: true }).click();
  await expect(chat(page).getByText(/no toqué nada/i)).toBeVisible();
  await expect(copia(page).getByRole('listitem')).toHaveCount(8);
});

test('cambiar precio: el cuenco pasa a $ 30.000', async ({ page }) => {
  await expect(copia(page).getByText('$ 28.000')).toBeVisible();
  await audio(page, /cuenco/i).click();
  await expect(copia(page).getByText('$ 30.000')).toBeVisible();
  await expect(copia(page).getByText('$ 28.000')).toHaveCount(0);
});

test('cambiar foto: la maceta estrena foto', async ({ page }) => {
  const foto = copia(page).getByRole('listitem').filter({ hasText: 'Maceta' }).locator('img');
  const antes = await foto.getAttribute('src');
  await audio(page, /foto a la maceta/i).click();
  await expect(chat(page).getByText(/cambié la foto/i)).toBeVisible();
  await expect(foto).not.toHaveAttribute('src', antes!);
  await expect(copia(page).getByRole('listitem')).toHaveCount(8);
});

test('deshacer vuelve atrás el último cambio', async ({ page }) => {
  await audio(page, /cuenco/i).click();
  await expect(copia(page).getByText('$ 30.000')).toBeVisible();
  await audio(page, /me equivoqué/i).click();
  await expect(copia(page).getByText('$ 28.000')).toBeVisible();
});

test('el chiste de los ravioles no cambia la página', async ({ page }) => {
  await audio(page, /ravioles/i).click();
  await expect(chat(page).getByText(/el domingo paso/i)).toBeVisible();
  await expect(copia(page).getByRole('listitem')).toHaveCount(8);
});

test('doble clic rápido manda el audio una sola vez', async ({ page }) => {
  await audio(page, /azucarera/i).dblclick();
  await expect(copia(page).getByText('$ 18.000')).toBeVisible();
  await expect(copia(page).getByRole('listitem')).toHaveCount(9);
  await expect(chat(page).getByText(/ya está en la página/i)).toHaveCount(1);
});

test('los botones Sí / No viejos no se pueden volver a tocar', async ({ page }) => {
  await audio(page, /vendí la taza/i).click();
  await chat(page).getByRole('button', { name: 'Sí', exact: true }).click();
  await expect(copia(page).getByRole('listitem')).toHaveCount(7);
  await expect(chat(page).getByRole('button', { name: 'Sí', exact: true })).toBeDisabled();
});

test('empezar de nuevo devuelve la muestra', async ({ page }) => {
  await audio(page, /azucarera/i).click();
  await expect(copia(page).getByRole('listitem')).toHaveCount(9);
  await page.getByRole('button', { name: /empezar de nuevo/i }).click();
  await expect(copia(page).getByRole('listitem')).toHaveCount(8);
  await expect(audio(page, /azucarera/i)).toBeVisible();
});

test('lo hecho se conserva al recargar', async ({ page }) => {
  await audio(page, /azucarera/i).click();
  await expect(copia(page).getByRole('listitem')).toHaveCount(9);
  await page.reload();
  await expect(copia(page).getByRole('listitem')).toHaveCount(9);
});

test('si la copia venció a mitad de camino, sigue andando desde la muestra', async ({ page }) => {
  await audio(page, /azucarera/i).click();
  await expect(copia(page).getByRole('listitem')).toHaveCount(9);
  expect((await page.request.post('/api/prueba/vencer')).ok()).toBe(true);
  await audio(page, /ravioles/i).click();
  await expect(chat(page).getByText(/el domingo paso/i)).toBeVisible();
  await expect(copia(page).getByRole('listitem')).toHaveCount(8);
});

test('la página real no cambia con lo que se hace en el simulador', async ({ page }) => {
  await audio(page, /azucarera/i).click();
  await expect(copia(page).getByText('$ 18.000')).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('listitem')).toHaveCount(8);
  await expect(page.getByText('Azucarera azul')).toHaveCount(0);
});

test('avisa que es una copia y que la página real no cambia', async ({ page }) => {
  await expect(page.getByText(/la página real no cambia/i)).toBeVisible();
});

test('en el celular hay pestañas para ir del chat a la página', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/simulador');
  await expect(chat(page)).toBeVisible();
  await expect(copia(page)).toBeHidden();
  await audio(page, /azucarera/i).click();
  await expect(chat(page).getByText(/ya está en la página/i)).toBeVisible();
  await page.getByRole('tab', { name: /página/i }).click();
  await expect(copia(page).getByText('$ 18.000')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await context.close();
});
