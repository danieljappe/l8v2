export const GA_MEASUREMENT_ID = 'G-7PW96SVNBD';
export const GA_SCRIPT_ID = 'ga-gtag';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const disableFlag = `ga-disable-${GA_MEASUREMENT_ID}`;

/**
 * Inject gtag.js. Must only be called after `statistics` consent: nothing here
 * runs, and no request to Google is made, until then. Idempotent.
 */
export function loadGoogleAnalytics(): void {
  (window as unknown as Record<string, unknown>)[disableFlag] = false;
  if (document.getElementById(GA_SCRIPT_ID)) return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    // gtag.js expects the arguments object itself, not a copied array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  // GA4 never stores IP addresses; anonymize_ip is kept as an explicit, harmless
  // statement of intent. No cookie_flags override: the default first-party,
  // SameSite=Lax cookie is all GA needs.
  window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });

  const script = document.createElement('script');
  script.id = GA_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

/**
 * Stop GA and erase its cookies. gtag.js cannot be evicted from memory once
 * evaluated, so the opt-out flag stops it sending anything for the rest of this
 * page view; the caller reloads to get a clean page.
 */
export function unloadGoogleAnalytics(): void {
  (window as unknown as Record<string, unknown>)[disableFlag] = true;
  document.getElementById(GA_SCRIPT_ID)?.remove();
  document
    .querySelectorAll('script[src*="googletagmanager.com"]')
    .forEach((s) => s.remove());
  delete window.gtag;
  delete window.dataLayer;
  deleteAnalyticsCookies();
}

/** _ga, _ga_<container>, plus the legacy _gid/_gat in case an older tag ever ran. */
export const GA_COOKIE_PATTERN = /^_(ga|ga_.+|gid|gat|gat_.+)$/;

/**
 * Every domain a cookie for this page could have been set on. GA's default
 * cookie_domain 'auto' writes to the highest settable domain (".l8events.dk"
 * when on www.l8events.dk), so deleting only on the current host would leave it.
 */
export function cookieDomainCandidates(hostname: string): string[] {
  const out: (string | undefined)[] = [undefined];
  if (hostname === 'localhost' || /^[\d.]+$/.test(hostname) || hostname.includes(':')) {
    return [''];
  }
  const labels = hostname.split('.');
  // Stop before the bare TLD, which no cookie may be set on.
  for (let i = 0; i < labels.length - 1; i++) {
    const d = labels.slice(i).join('.');
    out.push(d, `.${d}`);
  }
  return out.map((d) => d ?? '');
}

export function deleteAnalyticsCookies(): void {
  const names = document.cookie
    .split(';')
    .map((c) => c.split('=')[0].trim())
    .filter((n) => GA_COOKIE_PATTERN.test(n));
  const domains = cookieDomainCandidates(window.location.hostname);
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  for (const name of names) {
    for (const domain of domains) {
      const domainAttr = domain ? `; domain=${domain}` : '';
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/${domainAttr}${secure}`;
    }
  }
}
