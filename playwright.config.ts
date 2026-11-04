import { defineConfig, devices } from '@playwright/test';

/** End-to-end tests: catalog, editor, deck, export and print dimensions (SPEC §3.2). Start: npm run test:e2e */
export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173/',
    locale: 'de-DE',
    acceptDownloads: true,
    trace: 'retain-on-failure',
  },
  // Chromium and Firefox (install once: npx playwright install chromium firefox).
  // Single browser: npm run test:e2e -- --project=chromium
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
