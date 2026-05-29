import { test, expect } from '@playwright/test';

// ─── Smoke tests: all public pages render without crashing ────────────────────
//
// EQ class covered: "valid route" — each page belongs to the partition of routes
// that should render successfully without authentication.

const publicRoutes = [
  { path: '/', name: 'Home' },
  { path: '/events', name: 'Events' },
  { path: '/gallery', name: 'Gallery' },
  { path: '/about', name: 'About' },
  { path: '/contact', name: 'Contact' },
  { path: '/artists', name: 'Artists' },
];

for (const { path, name } of publicRoutes) {
  test(`${name} page (${path}) renders without an error boundary`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(path === '/' ? '^http://localhost:5173/?$' : path));
    await expect(page.locator('body')).not.toContainText('Something went wrong');
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });
}

// ─── Home page — stats section renders numeric values ────────────────────────

test.describe('Home page — stats section (EQ)', () => {
  test('renders at least one numeric count in the stats/showcase area', async ({ page }) => {
    await page.goto('/');
    // The stats section shows counts such as eventCount, venueCount, etc.
    // Any element containing a digit sequence qualifies
    const statsSection = page.locator('main, section').filter({ hasText: /\d+/ }).first();
    await expect(statsSection).toBeVisible({ timeout: 5000 });
  });
});

// ─── /login renders the login form ───────────────────────────────────────────

test('Login page renders the auth form', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /admin login/i })).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
});

// ─── Unknown route — BVA: invalid path partition ─────────────────────────────

test('navigating to a completely unknown route does not show a JS crash', async ({ page }) => {
  await page.goto('/this-route-does-not-exist-at-all-xyz');
  await expect(page.locator('body')).not.toContainText('Cannot read properties');
  await expect(page.locator('body')).not.toContainText('Uncaught');
});
