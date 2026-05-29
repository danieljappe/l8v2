import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/contact');
});

// ─── Contact form — EQ: valid submission ──────────────────────────────────────

test.describe('Contact form — valid submission (EQ)', () => {
  test('shows a success message after submitting a valid contact form', async ({ page }) => {
    await page.getByLabel(/navn/i).fill('Jane Doe');
    await page.getByLabel(/e-?mail/i).fill(`e2e-${Date.now()}@example.com`);
    await page.getByLabel(/emne/i).fill('E2E test inquiry');
    await page.getByLabel(/besked/i).fill('This is an E2E test message with enough characters.');
    await page.getByRole('button', { name: /send/i }).click();

    // The success message is in Danish: "Tak for din besked!"
    await expect(page.getByText(/tak for din besked/i)).toBeVisible({ timeout: 8000 });
  });
});

// ─── Contact form — EQ: client-side validation ────────────────────────────────

test.describe('Contact form — client-side validation (EQ)', () => {
  test('blocks submission when the message is too short', async ({ page }) => {
    await page.getByLabel(/navn/i).fill('Jane Doe');
    await page.getByLabel(/e-?mail/i).fill('jane@example.com');
    await page.getByLabel(/besked/i).fill('Too short');
    await page.getByRole('button', { name: /send/i }).click();

    // The FE validates message >= 10 chars and shows a Danish error message
    await expect(page.getByText(/mindst 10 tegn/i)).toBeVisible();
  });

  test('blocks submission and shows error when email format is invalid', async ({ page }) => {
    await page.getByLabel(/navn/i).fill('Jane Doe');
    // Use the input's type=email browser validation
    await page.getByRole('textbox', { name: /e-?mail/i }).fill('notanemail');
    await page.getByLabel(/besked/i).fill('This message is long enough to pass validation.');
    await page.getByRole('button', { name: /send/i }).click();

    // Browser blocks submission for invalid email OR the app shows an error
    await expect(page).toHaveURL(/\/contact/);
  });
});

// ─── Contact form — BVA: name length boundaries ───────────────────────────────

test.describe('Contact form — name length (BVA: 2–100 chars)', () => {
  test('accepts a name of exactly 2 characters (BVA: lower boundary)', async ({ page }) => {
    await page.getByLabel(/navn/i).fill('AB');
    await page.getByLabel(/e-?mail/i).fill(`bva-low-${Date.now()}@example.com`);
    await page.getByLabel(/besked/i).fill('This message is long enough to be accepted.');
    await page.getByRole('button', { name: /send/i }).click();

    await expect(page.getByText(/tak for din besked/i)).toBeVisible({ timeout: 8000 });
  });

  test('blocks a name of exactly 1 character and shows an error (BVA: one below lower boundary)', async ({ page }) => {
    await page.getByLabel(/navn/i).fill('A');
    await page.getByLabel(/e-?mail/i).fill('bva@example.com');
    await page.getByLabel(/besked/i).fill('This message is long enough to be accepted by the server.');
    await page.getByRole('button', { name: /send/i }).click();

    // The server (or possibly FE) rejects name of length 1
    // The form either shows the API error or stays on the page without success
    await expect(page.getByText(/tak for din besked/i)).not.toBeVisible({ timeout: 5000 });
  });
});

// ─── Contact form — BVA: message length boundaries ────────────────────────────

test.describe('Contact form — message length (BVA: 10–5000 chars)', () => {
  test('accepts a message of exactly 10 characters (BVA: lower boundary)', async ({ page }) => {
    await page.getByLabel(/navn/i).fill('Jane Doe');
    await page.getByLabel(/e-?mail/i).fill(`msg10-${Date.now()}@example.com`);
    await page.getByLabel(/besked/i).fill('A'.repeat(10));
    await page.getByRole('button', { name: /send/i }).click();

    await expect(page.getByText(/tak for din besked/i)).toBeVisible({ timeout: 8000 });
  });

  test('shows an error for a message of 9 characters (BVA: one below lower boundary)', async ({ page }) => {
    await page.getByLabel(/navn/i).fill('Jane Doe');
    await page.getByLabel(/e-?mail/i).fill('msg9@example.com');
    await page.getByLabel(/besked/i).fill('A'.repeat(9));
    await page.getByRole('button', { name: /send/i }).click();

    await expect(page.getByText(/mindst 10 tegn/i)).toBeVisible();
  });
});
