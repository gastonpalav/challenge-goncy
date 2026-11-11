import { expect, test } from '@playwright/test';

test('la app responde', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
});
