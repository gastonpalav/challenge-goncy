import { test } from '@playwright/test';

// Capturas para revisar a ojo. Solo corre si se pide: CAPTURA=carpeta npx playwright test _captura
test.skip(!process.env.CAPTURA, 'solo a pedido');

for (const [nombre, ruta, ancho, alto] of [
  ['movil', '/', 390, 844],
  ['movil-largo', '/prueba/largo', 320, 640],
  ['movil-vacio', '/prueba/vacio', 390, 844],
  ['escritorio', '/', 1280, 900],
] as const) {
  test(`captura ${nombre}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: ancho, height: alto } });
    const page = await context.newPage();
    await page.goto(ruta);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${process.env.CAPTURA}/${nombre}.png` });
    await context.close();
  });
}
