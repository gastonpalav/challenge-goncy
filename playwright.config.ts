import { defineConfig } from '@playwright/test';

const PORT = 3210;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'tests/e2e',
  workers: 1,
  use: { baseURL },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --port ${PORT}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
        env: { E2E: '1' },
      },
});
