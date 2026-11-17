import { expect, test, type Page } from '@playwright/test';

// En estos tests el modelo está reemplazado por uno de mentira (ver interpret.fake.ts):
// lo que se prueba es el recorrido completo, no la comprensión del lenguaje.

test.use({ viewport: { width: 1280, height: 900 } });

const copia = (page: Page) => page.getByRole('region', { name: /copia de prueba/i });
const chat = (page: Page) => page.getByRole('region', { name: /chat con goncy/i });
const campo = (page: Page) => page.getByRole('textbox', { name: /escribile a goncy/i });

async function escribir(page: Page, texto: string) {
  await campo(page).fill(texto);
  await page.getByRole('button', { name: 'Enviar' }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/simulador');
  await expect(copia(page).getByRole('listitem')).toHaveCount(9);
});

test('escribir que vendió una pieza: confirma y la saca', async ({ page }) => {
  await escribir(page, 'vendí el cuenco');
  await expect(chat(page).getByText('vendí el cuenco')).toBeVisible();
  await expect(chat(page).getByText('¿Esta vendiste, tía?')).toBeVisible();
  await chat(page).getByRole('button', { name: 'Sí', exact: true }).click();
  await expect(copia(page).getByRole('heading', { name: 'Cuenco' })).toHaveCount(0);
});

test('contestar "si" escribiendo vale como tocar el botón', async ({ page }) => {
  await escribir(page, 'vendí el cuenco');
  await expect(chat(page).getByText('¿Esta vendiste, tía?')).toBeVisible();
  await escribir(page, 'si');
  await expect(copia(page).getByRole('heading', { name: 'Cuenco' })).toHaveCount(0);
});

test('escribir un precio nuevo lo cambia', async ({ page }) => {
  await escribir(page, 'la maceta ahora sale 20000');
  await expect(copia(page).getByText('$ 20.000')).toBeVisible();
});

test('un precio corto se pregunta en miles', async ({ page }) => {
  await escribir(page, 'la maceta ahora sale 20');
  await expect(chat(page).getByText('¿$ 20.000, tía?')).toBeVisible();
  await expect(copia(page).getByText('$ 32.000')).toBeVisible();
  await chat(page).getByRole('button', { name: 'Sí', exact: true }).click();
  await expect(copia(page).getByText('$ 20.000')).toBeVisible();
});

test('el campo se vacía al enviar y Enter también envía', async ({ page }) => {
  await campo(page).fill('hola');
  await campo(page).press('Enter');
  await expect(chat(page).getByText(/el domingo paso/i)).toBeVisible();
  await expect(campo(page)).toHaveValue('');
});

test('no se puede enviar vacío y el texto tiene tope de 300 caracteres', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  await campo(page).fill('   ');
  await expect(page.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  await expect(campo(page)).toHaveAttribute('maxlength', '300');
});

test('algo que no se entiende no rompe ni cambia la página', async ({ page }) => {
  await escribir(page, 'asdf qwerty');
  await expect(chat(page).getByText(/no te entendí/i)).toBeVisible();
  await expect(copia(page).getByRole('listitem')).toHaveCount(9);
});

test('con el cupo agotado avisa, y los audios grabados siguen andando', async ({ page }) => {
  // Gasta los 30 textos del día de este visitante.
  for (let i = 0; i < 30; i += 1) {
    const res = await page.request.post('/api/sim/message', { data: { kind: 'text', text: 'hola' } });
    expect(res.ok()).toBe(true);
  }
  await escribir(page, 'vendí el cuenco');
  await expect(chat(page).getByText(/me quedé sin crédito/i)).toBeVisible();
  await expect(copia(page).getByRole('listitem')).toHaveCount(9);

  await page.getByRole('button', { name: /azucarera/i }).click();
  await expect(copia(page).getByText('$ 18.000')).toBeVisible();
});

test('mandar una foto de muestra y después decir nombre y precio la publica', async ({ page }) => {
  await page.getByRole('button', { name: 'Mandar una foto' }).click();
  await page.getByRole('button', { name: /foto de muestra 1/i }).click();
  await expect(chat(page).getByText(/cómo se llama y cuánto sale/i)).toBeVisible();
  await expect(copia(page).getByRole('listitem')).toHaveCount(9);

  await escribir(page, 'yerbera, 30000');
  await expect(chat(page).getByText(/ya está en la página/i)).toBeVisible();
  await expect(copia(page).getByRole('heading', { name: 'Yerbera' })).toBeVisible();
  await expect(copia(page).getByText('$ 30.000')).toBeVisible();
  await expect(copia(page).getByRole('listitem')).toHaveCount(10);
});

test('mandar una foto y decir que es la nueva de una pieza la reemplaza', async ({ page }) => {
  const foto = copia(page).getByRole('listitem').filter({ hasText: 'Florero' }).locator('img');
  const antes = await foto.getAttribute('src');
  await page.getByRole('button', { name: 'Mandar una foto' }).click();
  await page.getByRole('button', { name: /foto de muestra 2/i }).click();
  await escribir(page, 'es la foto nueva del florero');
  await expect(chat(page).getByText(/cambié la foto/i)).toBeVisible();
  await expect(foto).not.toHaveAttribute('src', antes!);
  await expect(copia(page).getByRole('listitem')).toHaveCount(9);
});
