import {
  NO_CONSENT,
  onConsentChange,
  readConsent,
  removeLegacyConsentKeys,
  subscribe,
  type ConsentChoices,
} from './consentStore';
import { CONSENT_VERSION } from './registry';
import { deleteAnalyticsCookies, loadGoogleAnalytics, unloadGoogleAnalytics } from './googleAnalytics';
import { API_BASE_URL } from '../services/api';

interface EffectsOptions {
  /** Injected so tests can observe it; defaults to a real page reload. */
  reload?: () => void;
}

/**
 * Applies the stored choice to the page and keeps it applied as it changes —
 * from the banner in this tab, or from another tab via the storage event.
 * Returns an unsubscribe function.
 */
export function startConsentEffects({ reload = () => window.location.reload() }: EffectsOptions = {}): () => void {
  removeLegacyConsentKeys();
  let applied: ConsentChoices | null = null;

  const apply = () => {
    const next = readConsent()?.categories ?? NO_CONSENT;
    const prev = applied;
    applied = next;

    if (next.statistics) {
      loadGoogleAnalytics();
    } else if (prev?.statistics) {
      unloadGoogleAnalytics();
      // gtag.js stays resident once evaluated; a reload is the only way to be
      // certain nothing from it keeps running. Embeds need no reload: the
      // gated components swap back to placeholders on the next render.
      reload();
    } else {
      // No consent now: clear any _ga left from an expired or pre-version choice.
      deleteAnalyticsCookies();
    }
  };

  apply();
  return subscribe(apply);
}

/**
 * Sends each decision to the backend as proof of consent. Only the random
 * consent id, the choices and the version are sent — no auth header, so an
 * admin's consent record is not linked to their account.
 */
export function startConsentProofLogging(): () => void {
  return onConsentChange((record) => {
    fetch(`${API_BASE_URL}/consent`, {
      method: 'POST',
      // Survives the reload that follows a withdrawal.
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consentId: record.id,
        version: CONSENT_VERSION,
        statistics: record.categories.statistics,
        externalMedia: record.categories.external_media,
      }),
    }).catch(() => {
      // Proof logging is best effort; the visitor's choice already applies locally.
    });
  });
}
