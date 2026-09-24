import type { Page } from '@playwright/test';
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from '../../src/consent/registry';

export interface SeedOptions {
  statistics?: boolean;
  externalMedia?: boolean;
  version?: number;
  decidedAt?: string;
}

/**
 * Pre-seed a consent choice so the banner stays out of the way. Defaults to
 * "reject all": tests that are not about consent must not load Google
 * Analytics or third-party embeds.
 */
export async function seedConsent(page: Page, opts: SeedOptions = {}): Promise<void> {
  const value = JSON.stringify({
    id: '00000000-0000-4000-8000-000000000000',
    version: opts.version ?? CONSENT_VERSION,
    decidedAt: opts.decidedAt ?? new Date().toISOString(),
    categories: { statistics: opts.statistics ?? false, external_media: opts.externalMedia ?? false },
  });
  await page.addInitScript(
    ([key, v]) => {
      // Only seed once per test, so a choice made during the test survives reloads.
      if (!sessionStorage.getItem('__consent_seeded')) {
        localStorage.setItem(key, v);
        sessionStorage.setItem('__consent_seeded', '1');
      }
    },
    [CONSENT_STORAGE_KEY, value] as const,
  );
}
