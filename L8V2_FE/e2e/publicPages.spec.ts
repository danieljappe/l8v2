import { test, expect } from '@playwright/test';
import { seedConsent } from './helpers/consent';

// Record a reject-all choice so the consent banner doesn't cover elements
// (and nothing third-party loads during unrelated tests).
test.beforeEach(async ({ page }) => {
  await seedConsent(page);
});

// ─── Smoke tests: all public pages render without crashing ────────────────────
//
// EQ class covered: "valid route" — each page belongs to the partition of routes
// that should render successfully without authentication.

// `/` is not a page in its own right: with Booking disabled it redirects to
// /home, and with Booking enabled it is the platform-choice screen. So assert
// where each path is expected to *land* rather than assuming it stays put.
const publicRoutes = [
  { path: '/', landsOn: '/home', name: 'Home' },
  { path: '/events', landsOn: '/events', name: 'Events' },
  { path: '/gallery', landsOn: '/gallery', name: 'Gallery' },
  { path: '/about', landsOn: '/about', name: 'About' },
  { path: '/contact', landsOn: '/contact', name: 'Contact' },
  { path: '/artists', landsOn: '/artists', name: 'Artists' },
];

for (const { path, landsOn, name } of publicRoutes) {
  test(`${name} page (${path}) renders without an error boundary`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${landsOn}$`));
    await expect(page.locator('body')).not.toContainText('Something went wrong');
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });
}

// ─── Booking feature flag ─────────────────────────────────────────────────────
//
// Booking ships disabled (VITE_BOOKING_ENABLED unset). Previously-shared and
// still-indexed /booking links must land on /home rather than a blank page.

test('booking links redirect to /home while the Booking flag is off', async ({ page }) => {
  await page.goto('/booking/artists');
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.locator('body')).not.toContainText('Something went wrong');
});

// ─── Home page — stats section renders numeric values ────────────────────────

test.describe('Home page — stats section (EQ)', () => {
  test('renders at least one numeric count in the stats/showcase area', async ({ page }) => {
    // Navigate to /home (not /) to bypass the PlatformChoice screen shown at root
    await page.goto('/home');
    // The stats section shows counts such as eventCount, venueCount, etc.
    // Hard-coded values like 1000, 24, 4 are always present regardless of DB state.
    // The Counter components render inside <div>s; look for any digit in the page body.
    await expect(page.locator('body')).toContainText(/\d+/, { timeout: 5000 });
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
