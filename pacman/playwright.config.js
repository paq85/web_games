import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    headless: true,
    viewport: { width: 1400, height: 900 }
  },
  webServer: {
    command: 'node dev-server.js --port 4173 --silent',
    port: 4173,
    reuseExistingServer: true,
    timeout: 30_000
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ]
});
