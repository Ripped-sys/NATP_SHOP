import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: 'e2e.spec.mjs', workers: 1, timeout: 60000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined), headless: true, screenshot: 'only-on-failure', trace: 'retain-on-failure' }
});
