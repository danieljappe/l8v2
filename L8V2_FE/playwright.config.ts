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

  // In CI the workflow starts both servers manually before running Playwright,
  // so webServer is not needed and must be omitted — otherwise Playwright tries
  // to start a second instance and hits EADDRINUSE on the already-occupied port.
  // Locally, webServer starts the servers if they are not already running.
  webServer: isCI ? undefined : [
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3000/api/stats',
      cwd: '../L8v2_BE',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
