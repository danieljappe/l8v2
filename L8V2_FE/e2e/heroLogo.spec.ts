import { test, expect, type Page } from '@playwright/test';

/**
 * The hero's 3D logo is desktop-only on purpose: it is decorative, its whole
 * interaction is cursor tilt, and Three.js is ~600 kB. These tests guard the
 * gate — that the flat logo is what a narrow or reduced-motion visitor gets,
 * and that they never download the 3D chunk.
 */

const hero = (page: Page) => page.locator('section').first();

function trackThreeRequests(page: Page): string[] {
  const requested: string[] = [];
  page.on('request', (request) => {
    if (/three|Hero3DLogoScene/i.test(request.url())) requested.push(request.url());
  });
  return requested;
}

test.describe('Home hero logo', () => {
  test('renders the interactive 3D logo on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/home');

    await expect(hero(page).locator('canvas')).toBeVisible();
    // The canvas carries no accessible name of its own.
    await expect(hero(page).getByText('L8 Events', { exact: true })).toBeAttached();
  });

  test('falls back to the flat logo below the desktop breakpoint', async ({ page }) => {
    const three = trackThreeRequests(page);
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto('/home');

    await expect(hero(page).locator('img[alt="L8 Events"]')).toBeVisible();
    await expect(hero(page).locator('canvas')).toHaveCount(0);
    expect(three, 'Three.js must not be fetched on the fallback path').toEqual([]);
  });

  test('falls back to the flat logo when reduced motion is requested', async ({ page }) => {
    const three = trackThreeRequests(page);
    // Set imperatively rather than via test.use: the context-level option did
    // not reliably reach the page when another test had already run in the
    // worker, and the page then saw `no-preference`.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/home');

    await expect(hero(page).locator('img[alt="L8 Events"]')).toBeVisible();
    await expect(hero(page).locator('canvas')).toHaveCount(0);
    expect(three, 'Three.js must not be fetched on the fallback path').toEqual([]);
  });
});
