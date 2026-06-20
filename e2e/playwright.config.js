// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false, // testovi dijele stanje baze — sekvencijalno
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:9000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
