import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3009',
    headless: true,
    viewport: { width: 1024, height: 768 },
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'node dev-server.js --port 3009',
    port: 3009,
    reuseExistingServer: !process.env.CI,
  },
});
