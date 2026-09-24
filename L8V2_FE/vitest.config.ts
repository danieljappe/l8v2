import { defineConfig } from 'vitest/config';

// Node >= 22 ships its own global localStorage (enabled by default from 25),
// which shadows jsdom's and throws without --localstorage-file. Turn it off
// in the test workers; older Node (CI runs 18) does not know the flag.
const nodeMajor = Number(process.versions.node.split('.')[0]);
const execArgv = nodeMajor >= 22 ? ['--no-experimental-webstorage'] : [];

// Unit tests only. Kept apart from vite.config.ts so the build's compression
// plugins do not load under test. Browser-level behaviour lives in e2e/.
export default defineConfig({
  test: {
    environment: 'jsdom',
    poolOptions: { forks: { execArgv } },
    include: ['src/**/*.test.{ts,tsx}'],
    environmentOptions: {
      // A real production hostname, so cookie-domain handling is exercised
      // against www.l8events.dk / .l8events.dk rather than localhost.
      jsdom: { url: 'https://www.l8events.dk/' },
    },
  },
});
