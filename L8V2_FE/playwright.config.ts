import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  // Retry twice in CI to absorb transient flakiness; none locally (fail fast)
  retries: isCI ? 2 : 0,
  reporter: isCI ? 'github' : 'list',

  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      // In CI always start fresh; locally reuse a running server
      reuseExistingServer: !isCI,
      timeout: isCI ? 60_000 : 30_000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      cwd: '../L8v2_BE',
      reuseExistingServer: !isCI,
      timeout: isCI ? 60_000 : 30_000,
    },
  ],
});
