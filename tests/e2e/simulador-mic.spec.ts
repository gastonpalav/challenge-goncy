import { expect, test, type Page } from '@playwright/test';

// El audio a texto está reemplazado por uno de mentira que siempre "escucha": vendí el cuenco.

const copia = (page: Page) => page.getByRole('region', { name: /copia de prueba/i });
const chat = (page: Page) => page.getByRole('region', { name: /chat con goncy/i });
const audioFalso = { name: 'audio.webm', mimeType: 'audio/webm', buffer: Buffer.alloc(2000, 1) };

// Micrófono de mentira de Chromium, que además acepta solo el pedido de permiso.
test.use({ launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] } });

test.describe('con micrófono', () => {
  test.use({ viewport: { width: 1280, height: 900 }, permissions: ['microphone'] });

  test('grabar un audio y mandarlo: el sobrino lo entiende', async ({ page }) => {
    await page.goto('/simulador');
    await page.getByRole('button', { name: 'Grabar audio' }).click();
    await expect(page.getByText(/grabando/i)).toBeVisible();
    await page.waitForTimeout(700);
    await page.getByRole('button', { name: 'Enviar audio' }).click();
    await expect(chat(page).getByText(/vendí el cuenco/i)).toBeVisible();
    await expect(chat(page).getByText('¿Esta vendiste, tía?')).toBeVisible();
    await chat(page).getByRole('button', { name: 'Sí', exact: true }).click();
    await expect(copia(page).getByRole('heading', { name: 'Cuenco' })).toHaveCount(0);
  });

  test('se puede cancelar una grabación sin mandar nada', async ({ page }) => {
    await page.goto('/simulador');
    await page.getByRole('button', { name: 'Grabar audio' }).click();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByRole('button', { name: 'Grabar audio' })).toBeVisible();
    await expect(chat(page).getByText(/vendí el cuenco/i)).toHaveCount(0);
  });
});

test.describe('sin permiso de micrófono', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('avisa en el chat y lo demás sigue andando', async ({ page }) => {
    // El navegador de prueba acepta siempre: el rechazo se simula en la página.
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () =>
        Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
    });
    await page.goto('/simulador');
    await page.getByRole('button', { name: 'Grabar audio' }).click();
    await expect(chat(page).getByText(/no te escuché bien/i)).toBeVisible();
    await page.getByRole('button', { name: /azucarera/i }).click();
    await expect(copia(page).getByText('$ 18.000')).toBeVisible();
  });
});

test.describe('límites del audio', () => {
  test('pasado el cupo de audios del día se rechaza con aviso', async ({ request }) => {
    let last = '';
    for (let i = 0; i < 31; i += 1) {
      const res = await request.post('/api/sim/message', { multipart: { kind: 'audio', file: audioFalso } });
      expect(res.ok()).toBe(true);
      last = JSON.stringify(await res.json());
    }
    expect(last).toMatch(/sin crédito/i);
  });

  test('un audio de más de 500 KB no se procesa', async ({ request }) => {
    const res = await request.post('/api/sim/message', {
      multipart: { kind: 'audio', file: { ...audioFalso, buffer: Buffer.alloc(600_000, 1) } },
    });
    expect(res.ok()).toBe(true);
    expect(JSON.stringify(await res.json())).toMatch(/no te escuché bien/i);
  });

  test('un archivo que no es audio no se procesa', async ({ request }) => {
    const res = await request.post('/api/sim/message', {
      multipart: { kind: 'audio', file: { name: 'x.html', mimeType: 'text/html', buffer: Buffer.from('<p>hola</p>') } },
    });
    expect(JSON.stringify(await res.json())).toMatch(/no te escuché bien/i);
  });
});
