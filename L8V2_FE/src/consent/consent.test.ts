import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL_CONSENT, NO_CONSENT, readConsent, saveConsent, grantCategory } from './consentStore';
import { startConsentEffects } from './consentEffects';
import { GA_SCRIPT_ID, cookieDomainCandidates, deleteAnalyticsCookies } from './googleAnalytics';
import { CONSENT_MAX_AGE_MS, CONSENT_STORAGE_KEY, CONSENT_VERSION } from './registry';
import { extractIframeSrc, safeEmbedSrc } from './embedPolicy';

const gaScript = () => document.getElementById(GA_SCRIPT_ID);
const gaInjected = () => document.querySelector('script[src*="googletagmanager.com"]') !== null;

function clearAllCookies() {
  for (const name of document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter(Boolean)) {
    for (const d of ['', '; domain=www.l8events.dk', '; domain=.l8events.dk']) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d}`;
    }
  }
}

let stopEffects: (() => void) | undefined;

beforeEach(() => {
  localStorage.clear();
  clearAllCookies();
  document.head.innerHTML = '';
  delete window.gtag;
  delete window.dataLayer;
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(null, { status: 201 }))));
});

afterEach(() => {
  stopEffects?.();
  stopEffects = undefined;
  vi.unstubAllGlobals();
});

// ─── Stored choice ───────────────────────────────────────────────────────────

describe('consent store', () => {
  it('has no consent before the visitor chooses', () => {
    expect(readConsent()).toBeNull();
  });

  it('stores categories, version, timestamp and a random consent id', () => {
    const now = new Date('2026-09-24T12:00:00Z');
    saveConsent({ statistics: true, external_media: false }, now);
    const stored = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)!);
    expect(stored).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/),
      version: CONSENT_VERSION,
      decidedAt: now.toISOString(),
      categories: { statistics: true, external_media: false },
    });
  });

  it('keeps the same consent id across later decisions, so a withdrawal links to the grant', () => {
    const first = saveConsent(ALL_CONSENT);
    const second = saveConsent(NO_CONSENT);
    expect(second.id).toBe(first.id);
  });

  it('re-prompts when CONSENT_VERSION is bumped', () => {
    const record = saveConsent(ALL_CONSENT);
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ ...record, version: CONSENT_VERSION - 1 }));
    expect(readConsent()).toBeNull();
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ ...record, version: CONSENT_VERSION + 1 }));
    expect(readConsent()).toBeNull();
  });

  it('re-prompts after 12 months, even for an already-read choice', () => {
    const decided = new Date('2025-01-01T00:00:00Z');
    saveConsent(ALL_CONSENT, decided);
    expect(readConsent(decided.getTime() + CONSENT_MAX_AGE_MS - 1)).not.toBeNull();
    expect(readConsent(decided.getTime() + CONSENT_MAX_AGE_MS + 1)).toBeNull();
  });

  it('treats anything but an explicit true as refused (no pre-ticked categories)', () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        id: '3f1c2b1a-8d4e-4c6f-9a2b-1e2d3c4b5a69',
        version: CONSENT_VERSION,
        decidedAt: new Date().toISOString(),
        categories: { statistics: 'yes', external_media: 1 },
      }),
    );
    expect(readConsent()?.categories).toEqual({ statistics: false, external_media: false });
  });

  it('grantCategory adds one category without touching the other', () => {
    saveConsent({ statistics: true, external_media: false });
    grantCategory('external_media');
    expect(readConsent()?.categories).toEqual({ statistics: true, external_media: true });
  });
});

// ─── Google Analytics gating ─────────────────────────────────────────────────

describe('Google Analytics gating', () => {
  it('injects nothing before consent', () => {
    stopEffects = startConsentEffects({ reload: vi.fn() });
    expect(gaInjected()).toBe(false);
    expect(window.gtag).toBeUndefined();
  });

  it('injects nothing after "Afvis alle"', () => {
    stopEffects = startConsentEffects({ reload: vi.fn() });
    saveConsent(NO_CONSENT);
    expect(gaInjected()).toBe(false);
  });

  it('injects gtag.js once statistics is accepted, with IP anonymisation', () => {
    stopEffects = startConsentEffects({ reload: vi.fn() });
    saveConsent(ALL_CONSENT);
    expect(gaScript()?.getAttribute('src')).toMatch(/^https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-/);
    const config = (window.dataLayer as IArguments[]).map((a) => Array.from(a)).find((a) => a[0] === 'config');
    expect(config?.[2]).toMatchObject({ anonymize_ip: true });
  });

  it('on withdrawal: removes gtag, deletes _ga cookies on .l8events.dk and reloads', () => {
    const reload = vi.fn();
    stopEffects = startConsentEffects({ reload });
    saveConsent(ALL_CONSENT);
    document.cookie = '_ga=GA1.1.123.456; path=/; domain=.l8events.dk';
    document.cookie = '_ga_7PW96SVNBD=GS1.1.789; path=/; domain=.l8events.dk';
    document.cookie = 'unrelated=keep; path=/';
    expect(document.cookie).toContain('_ga=');

    saveConsent(NO_CONSENT);

    expect(gaInjected()).toBe(false);
    expect(window.gtag).toBeUndefined();
    expect(document.cookie).not.toMatch(/(^|;\s*)_ga/);
    expect(document.cookie).toContain('unrelated=keep');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('clears stale _ga cookies on load when there is no valid consent', () => {
    document.cookie = '_ga=GA1.1.stale; path=/; domain=.l8events.dk';
    stopEffects = startConsentEffects({ reload: vi.fn() });
    expect(document.cookie).not.toContain('_ga=');
  });
});

describe('cookie domain candidates', () => {
  it('covers the host and every parent domain, with and without a leading dot', () => {
    expect(cookieDomainCandidates('www.l8events.dk')).toEqual([
      '',
      'www.l8events.dk',
      '.www.l8events.dk',
      'l8events.dk',
      '.l8events.dk',
    ]);
  });

  it('never targets a bare TLD', () => {
    expect(cookieDomainCandidates('l8events.dk')).not.toContain('dk');
    expect(cookieDomainCandidates('l8events.dk')).not.toContain('.dk');
  });

  it('deletes host-only _ga cookies too', () => {
    document.cookie = '_ga=host-only; path=/';
    deleteAnalyticsCookies();
    expect(document.cookie).not.toContain('_ga=');
  });
});

// ─── Proof logging ───────────────────────────────────────────────────────────

describe('consent proof', () => {
  it('posts id, choices and version — and no auth header', async () => {
    const { startConsentProofLogging } = await import('./consentEffects');
    localStorage.setItem('token', 'admin-jwt');
    const stop = startConsentProofLogging();
    const record = saveConsent({ statistics: false, external_media: true });
    stop();

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/consent$/);
    expect(JSON.parse(init.body as string)).toEqual({
      consentId: record.id,
      version: CONSENT_VERSION,
      statistics: false,
      externalMedia: true,
    });
    expect(init.headers).not.toHaveProperty('Authorization');
  });
});

// ─── Embed policy ────────────────────────────────────────────────────────────

describe('embed policy', () => {
  it('rewrites YouTube to youtube-nocookie.com', () => {
    expect(safeEmbedSrc('youtube', 'https://www.youtube.com/embed/abc123?si=x')).toBe(
      'https://www.youtube-nocookie.com/embed/abc123?si=x',
    );
  });

  it('rejects a src that is not on the provider allowlist, or not HTTPS', () => {
    expect(safeEmbedSrc('spotify', 'https://evil.example/embed')).toBeNull();
    expect(safeEmbedSrc('spotify', 'http://open.spotify.com/embed/artist/1')).toBeNull();
    expect(safeEmbedSrc('google_maps', 'https://www.google.com/search?q=x')).toBeNull();
    expect(safeEmbedSrc('google_maps', 'https://www.google.com/maps/embed?pb=1')).not.toBeNull();
  });

  it('extracts the iframe src without creating live elements', () => {
    const html = '<img src="https://tracker.example/p.gif"><iframe src="https://open.spotify.com/embed/x"></iframe>';
    expect(extractIframeSrc(html)).toBe('https://open.spotify.com/embed/x');
    expect(document.querySelector('img[src*="tracker"]')).toBeNull();
  });
});
