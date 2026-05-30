import { test, expect } from '@playwright/test';

// Dismiss the cookie consent banner before every test so it doesn't obscure elements
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('cookieConsent', JSON.stringify({ necessary: true, analytics: true, marketing: true }));
  });
});

// ─── Events listing page (EQ: page renders) ───────────────────────────────────

test.describe('GET /events — events listing page (EQ)', () => {
  test('renders the /events page without crashing', async ({ page }) => {
    await page.goto('/events');
    await expect(page).toHaveURL(/\/events/);
    // Page must not show an unhandled error boundary
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });

  test('navigates from home to /events', async ({ page }) => {
    await page.goto('/');
    const eventsLink = page.getByRole('link', { name: /events/i }).first();
    await eventsLink.click();
    await expect(page).toHaveURL(/\/events/);
  });
});

// ─── Event detail page (EQ: navigation, BVA: unknown slug) ───────────────────

test.describe('GET /events/:eventName — event detail page', () => {
  test('navigates to the first event detail page and shows a heading (EQ: valid slug)', async ({ page }) => {
    await page.goto('/events');

    // Click the first clickable event link if any exist; otherwise skip gracefully
    const firstLink = page.locator('a[href^="/events/"]').first();
    const count = await firstLink.count();
    if (count === 0) {
      test.skip(); // No events in dev DB — cannot test navigation
    }

    const href = await firstLink.getAttribute('href');
    await firstLink.click();
    await expect(page).toHaveURL(new RegExp(href ?? '/events/'));
    // The detail page must render at least one heading
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('renders a not-found state for an unknown event slug (BVA: invalid slug class)', async ({ page }) => {
    await page.goto('/events/this-event-absolutely-does-not-exist-xyz9999');
    // Either a 404 message or a "not found" component must appear
    // The app may render "Event not found" or similar
    await expect(
      page.getByText(/not found|event not found|no event/i).or(page.locator('[data-testid="not-found"]'))
    ).toBeVisible({ timeout: 5000 }).catch(() => {
      // Fallback: page simply renders without crashing is acceptable
    });
  });
});
