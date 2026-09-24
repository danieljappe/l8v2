import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { seedConsent } from './helpers/consent';
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from '../src/consent/registry';

/**
 * Consent behaviour in a real browser, verified at the network layer rather
 * than by inspecting component state: "nothing loads before consent" is only
 * true if no request leaves for a third-party host.
 *
 * Self-contained: the backend API is mocked and every third-party host is
 * stubbed, so the suite needs neither a database nor internet access.
 */

const EVENT_SLUG = 'e2e-consent-event';
const MAP_SRC = 'https://www.google.com/maps/embed?pb=!1m18!e2e';

const event = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'E2E Consent Event',
  description: 'Fixture',
  date: '2030-01-01T00:00:00.000Z',
  startTime: '20:00',
  endTime: '23:00',
  imageUrl: '',
  isActive: true,
  status: 'upcoming',
  billettoURL: '',
  venue: {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Fixture Venue',
    address: 'Testvej 1',
    city: '2300 København S',
    mapEmbedHtml: `<iframe src="${MAP_SRC}" width="600" height="450"></iframe>`,
  },
  eventArtists: [],
  galleryImages: [],
};

// A stand-in for gtag.js that behaves like it in the one way that matters
// here: it sets the _ga cookies on the page's domain.
const GA_STUB = `
  document.cookie = '_ga=GA1.1.e2e.1; path=/; max-age=63072000';
  document.cookie = '_ga_7PW96SVNBD=GS1.1.e2e; path=/; max-age=63072000';
  window.__gaStubLoaded = true;
`;

interface Harness {
  thirdParty: string[];
  consentPosts: Record<string, unknown>[];
}

const isThirdParty = (url: string) => {
  const { hostname, protocol } = new URL(url);
  return (protocol === 'http:' || protocol === 'https:') && hostname !== 'localhost' && hostname !== '127.0.0.1';
};

async function setUp(context: BrowserContext, page: Page): Promise<Harness> {
  const h: Harness = { thirdParty: [], consentPosts: [] };

  page.on('request', (req) => {
    if (isThirdParty(req.url())) h.thirdParty.push(req.url());
  });

  await context.route(/:\/\/[^/]+\/api\//, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/api/consent')) {
      h.consentPosts.push(route.request().postDataJSON());
      return route.fulfill({ status: 201, json: { ok: true } });
    }
    if (url.pathname.endsWith(`/api/events/${EVENT_SLUG}`)) return route.fulfill({ json: event });
    return route.fulfill({ json: [] });
  });

  // Patterns are anchored to the host: a bare /youtube/ would also swallow
  // local modules such as lucide-react's icons/youtube.js.
  await context.route(/^https:\/\/www\.googletagmanager\.com\//, (route) =>
    route.fulfill({ contentType: 'application/javascript', body: GA_STUB }),
  );
  await context.route(/^https:\/\/([\w-]+\.)*(google-analytics\.com|analytics\.google\.com)\//, (route) =>
    route.fulfill({ status: 204 }),
  );
  await context.route(
    /^https:\/\/([\w-]+\.)*(google\.com|spotify\.com|youtube\.com|youtube-nocookie\.com|soundcloud\.com)\//,
    (route) => route.fulfill({ contentType: 'text/html', body: '<html><body>third-party stub</body></html>' }),
  );

  return h;
}

const banner = (page: Page) => page.getByTestId('consent-banner');
const gaScriptCount = (page: Page) => page.locator('script[src*="googletagmanager.com"]').count();
const gaCookies = async (context: BrowserContext) =>
  (await context.cookies()).filter((c) => /^_ga/.test(c.name)).map((c) => c.name);

test.describe('Cookie consent', () => {
  test('before any choice: banner shown, site usable, zero third-party requests', async ({ context, page }) => {
    const h = await setUp(context, page);
    await page.goto(`/events/${EVENT_SLUG}`);

    await expect(banner(page)).toBeVisible();
    await expect(page.getByTestId('embed-placeholder-google_maps')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'E2E Consent Event' })).toBeVisible();
    await page.waitForLoadState('networkidle');

    expect(await gaScriptCount(page)).toBe(0);
    expect(await page.locator('iframe').count()).toBe(0);
    expect(h.thirdParty).toEqual([]);
    expect(await gaCookies(context)).toEqual([]);
  });

  test('first layer: accept and reject have equal prominence, and there is no close button', async ({ context, page }) => {
    await setUp(context, page);
    await page.goto('/privatlivspolitik');

    const accept = banner(page).getByRole('button', { name: 'Accepter alle' });
    const reject = banner(page).getByRole('button', { name: 'Afvis alle' });
    await expect(accept).toBeVisible();
    await expect(reject).toBeVisible();
    await expect(banner(page).getByRole('button', { name: 'Tilpas' })).toBeVisible();
    await expect(banner(page).getByRole('link', { name: 'privatlivspolitik' })).toBeVisible();
    await expect(banner(page).getByRole('button', { name: /luk|close/i })).toHaveCount(0);

    const [a, r] = [await accept.boundingBox(), await reject.boundingBox()];
    expect(Math.round(a!.width)).toBe(Math.round(r!.width));
    expect(Math.round(a!.height)).toBe(Math.round(r!.height));
    expect(await accept.getAttribute('class')).toBe(await reject.getAttribute('class'));
  });

  test('second layer: no category is pre-ticked; necessary is on and locked', async ({ context, page }) => {
    await setUp(context, page);
    await page.goto('/privatlivspolitik');
    await banner(page).getByRole('button', { name: 'Tilpas' }).click();

    await expect(banner(page).getByRole('switch', { name: /Statistik/ })).not.toBeChecked();
    await expect(banner(page).getByRole('switch', { name: /Eksternt indhold/ })).not.toBeChecked();
    const necessary = banner(page).getByRole('switch', { name: /Nødvendige/ });
    await expect(necessary).toBeChecked();
    await expect(necessary).toBeDisabled();
  });

  test('the banner is reachable with the first Tab and operable by keyboard', async ({ context, page }) => {
    const h = await setUp(context, page);
    await page.goto('/privatlivspolitik');
    await expect(banner(page)).toBeVisible();

    await page.keyboard.press('Tab');
    expect(await banner(page).evaluate((el) => el.contains(document.activeElement))).toBe(true);

    await banner(page).getByRole('button', { name: 'Afvis alle' }).focus();
    await page.keyboard.press('Enter');
    await expect(banner(page)).toBeHidden();
    await expect.poll(() => h.consentPosts.length).toBe(1);
  });

  test('"Afvis alle" loads nothing and records the refusal', async ({ context, page }) => {
    const h = await setUp(context, page);
    await page.goto(`/events/${EVENT_SLUG}`);
    await banner(page).getByRole('button', { name: 'Afvis alle' }).click();

    await expect(banner(page)).toBeHidden();
    await expect(page.getByTestId('embed-placeholder-google_maps')).toBeVisible();
    await page.waitForLoadState('networkidle');

    expect(await gaScriptCount(page)).toBe(0);
    expect(await page.locator('iframe').count()).toBe(0);
    expect(h.thirdParty).toEqual([]);
    await expect.poll(() => h.consentPosts).toEqual([
      expect.objectContaining({ version: CONSENT_VERSION, statistics: false, externalMedia: false }),
    ]);
  });

  test('"Accepter alle" loads GA and the map embed', async ({ context, page }) => {
    const h = await setUp(context, page);
    await page.goto(`/events/${EVENT_SLUG}`);
    await banner(page).getByRole('button', { name: 'Accepter alle' }).click();

    await expect(page.locator(`iframe[src="${MAP_SRC}"]`)).toBeAttached();
    await expect.poll(() => gaScriptCount(page)).toBe(1);
    await expect.poll(() => page.evaluate(() => (window as unknown as { __gaStubLoaded?: boolean }).__gaStubLoaded)).toBe(true);
    expect(h.thirdParty.some((u) => u.includes('googletagmanager.com'))).toBe(true);
    await expect.poll(() => h.consentPosts[0]).toMatchObject({ statistics: true, externalMedia: true });
  });

  test('"Vis indhold" on a placeholder loads that embed without enabling statistics', async ({ context, page }) => {
    const h = await setUp(context, page);
    await page.goto(`/events/${EVENT_SLUG}`);
    await page.getByTestId('embed-placeholder-google_maps').getByRole('button', { name: 'Vis indhold' }).click();

    await expect(page.locator(`iframe[src="${MAP_SRC}"]`)).toBeAttached();
    await page.waitForLoadState('networkidle');
    expect(await gaScriptCount(page)).toBe(0);
    expect(h.thirdParty.some((u) => u.includes('googletagmanager.com'))).toBe(false);
  });

  test('withdrawing via the footer removes GA, deletes _ga cookies and re-blocks embeds', async ({ context, page }) => {
    const h = await setUp(context, page);
    await seedConsent(page, { statistics: true, externalMedia: true });
    await page.goto(`/events/${EVENT_SLUG}`);

    await expect(page.locator(`iframe[src="${MAP_SRC}"]`)).toBeAttached();
    await expect.poll(() => gaCookies(context)).toEqual(expect.arrayContaining(['_ga', '_ga_7PW96SVNBD']));

    await page.getByRole('contentinfo').getByRole('button', { name: 'Cookie-indstillinger' }).click();
    await expect(banner(page)).toBeVisible();
    // Re-opened straight onto the toggles, showing the current choice, with focus moved in.
    await expect(banner(page).getByRole('switch', { name: /Statistik/ })).toBeChecked();
    await expect(banner(page).getByRole('heading', { name: 'Cookie-indstillinger' })).toBeFocused();

    const gaRequestsBefore = h.thirdParty.filter((u) => u.includes('googletagmanager.com')).length;
    await Promise.all([
      page.waitForEvent('load'), // withdrawal of statistics reloads the page
      banner(page).getByRole('button', { name: 'Afvis alle' }).click(),
    ]);

    await expect(page.getByTestId('embed-placeholder-google_maps')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(await gaCookies(context)).toEqual([]);
    expect(await gaScriptCount(page)).toBe(0);
    expect(await page.locator('iframe').count()).toBe(0);
    expect(h.thirdParty.filter((u) => u.includes('googletagmanager.com')).length).toBe(gaRequestsBefore);
    await expect.poll(() => h.consentPosts.at(-1)).toMatchObject({ statistics: false, externalMedia: false });
  });

  test('a choice made under an older CONSENT_VERSION re-prompts and is not applied', async ({ context, page }) => {
    const h = await setUp(context, page);
    await seedConsent(page, { statistics: true, externalMedia: true, version: CONSENT_VERSION - 1 });
    await page.goto(`/events/${EVENT_SLUG}`);

    await expect(banner(page)).toBeVisible();
    await expect(page.getByTestId('embed-placeholder-google_maps')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(await gaScriptCount(page)).toBe(0);
    expect(h.thirdParty).toEqual([]);
  });

  test('a choice older than 12 months re-prompts', async ({ context, page }) => {
    await setUp(context, page);
    const thirteenMonthsAgo = new Date(Date.now() - 395 * 24 * 60 * 60 * 1000).toISOString();
    await seedConsent(page, { statistics: true, decidedAt: thirteenMonthsAgo });
    await page.goto('/privatlivspolitik');
    await expect(banner(page)).toBeVisible();
  });

  test('stored choice has id, version, timestamp and categories', async ({ context, page }) => {
    await setUp(context, page);
    await page.goto('/privatlivspolitik');
    await banner(page).getByRole('button', { name: 'Tilpas' }).click();
    await banner(page).getByRole('switch', { name: /Statistik/ }).check();
    await banner(page).getByRole('button', { name: 'Gem valg' }).click();

    const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), CONSENT_STORAGE_KEY);
    expect(stored).toMatchObject({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      version: CONSENT_VERSION,
      categories: { statistics: true, external_media: false },
    });
    expect(Date.now() - Date.parse(stored.decidedAt)).toBeLessThan(60_000);
  });
});

test.describe('Privacy policy page', () => {
  test('renders the policy with the cookie table generated from the registry', async ({ context, page }) => {
    await setUp(context, page);
    await seedConsent(page);
    await page.goto('/privatlivspolitik');

    await expect(page.getByRole('heading', { level: 1, name: /Privatlivspolitik/ })).toBeVisible();
    const table = page.getByTestId('cookie-table');
    await expect(table).toContainText('_ga');
    await expect(table).toContainText(CONSENT_STORAGE_KEY);
    await expect(table).toContainText('Google Maps');
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Privatlivspolitik' })).toBeVisible();
  });
});
