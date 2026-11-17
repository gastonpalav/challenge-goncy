import { expect, test } from '@playwright/test';

for (const ruta of ['/', '/simulador', '/consulta/taza-marron']) {
  test(`sin errores de consola ni de hidratación en ${ruta}`, async ({ page }) => {
    const errores: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error' || /hydrat/i.test(m.text())) errores.push(m.text());
    });
    page.on('pageerror', (e) => errores.push(String(e)));
    await page.goto(ruta);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    expect(errores).toEqual([]);
  });
}
