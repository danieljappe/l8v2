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

  // In CI the job starts servers manually (build → migration:run → background node/vite).
  // reuseExistingServer:true tells Playwright to use whatever is already listening;
  // if nothing is listening locally, it falls back to running the command.
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      cwd: '../L8v2_BE',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
