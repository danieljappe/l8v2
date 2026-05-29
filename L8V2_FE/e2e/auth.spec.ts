import { test, expect } from '@playwright/test';

// Credentials must exist in the running dev database.
// Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD as environment variables,
// or create a .env.e2e file and export them before running Playwright.
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@l8events.dk';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? '';

// ─── PrivateRoute guard ────────────────────────────────────────────────────────

test.describe('PrivateRoute guard (EQ)', () => {
  test('redirects unauthenticated users from /admin to /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page renders the Admin Login heading', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /admin login/i })).toBeVisible();
  });
});

// ─── Login form — invalid credentials (EQ) ────────────────────────────────────

test.describe('Login form — invalid credentials (EQ)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows an error message for a wrong password', async ({ page }) => {
    await page.getByLabel(/email/i).fill('somebody@example.com');
    await page.getByLabel(/password/i).fill('definitely-wrong');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test('shows an error for a non-existent email', async ({ page }) => {
    await page.getByLabel(/email/i).fill('ghost@nowhere.com');
    await page.getByLabel(/password/i).fill('SomePassword123!');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });
});

// ─── Login form — BVA: boundary inputs ───────────────────────────────────────

test.describe('Login form — boundary inputs (BVA)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('does not submit when email field is empty (browser validation)', async ({ page }) => {
    await page.getByLabel(/password/i).fill('SomePassword!');
    await page.getByRole('button', { name: /login/i }).click();
    // The <input type="email" required> prevents submission; URL stays on /login
    await expect(page).toHaveURL(/\/login/);
  });

  test('does not submit when password field is empty (browser validation)', async ({ page }) => {
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

// ─── Successful login flow (EQ: valid credentials class) ─────────────────────

test.describe('Successful login flow', () => {
  test.skip(!ADMIN_PASSWORD, 'Set E2E_ADMIN_PASSWORD to run authenticated flow tests');

  test('redirects to /admin after successful login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/admin/);
  });

  test('redirects /login to /admin when already authenticated', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/admin/);

    await page.goto('/login');
    await expect(page).toHaveURL(/\/admin/);
  });
});
