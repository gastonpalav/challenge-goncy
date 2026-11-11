import { test } from '@playwright/test';

test.skip(!process.env.CAPTURA, 'solo a pedido');

test('captura simulador', async ({ browser }) => {
  for (const [nombre, ancho, alto] of [['sim-escritorio', 1280, 860], ['sim-movil', 390, 844]] as const) {
    const context = await browser.newContext({ viewport: { width: ancho, height: alto } });
    const page = await context.newPage();
    await page.goto('/simulador');
    await page.getByRole('button', { name: /azucarera/i }).click();
    await page.getByText(/ya está en la página/i).waitFor();
    await page.getByRole('button', { name: /vendí la taza/i }).click();
    await page.getByText('¿Esta vendiste, tía?').waitFor();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${process.env.CAPTURA}/${nombre}.png` });
    await context.close();
  }
});
