import type { RegistryItemId } from './registry';

export type EmbedProvider = Extract<RegistryItemId, 'google_maps' | 'spotify' | 'youtube' | 'soundcloud'>;

/**
 * Hosts each provider's iframe may point at. The placeholder names a provider
 * before consent, so an embed must not be able to load something else once
 * consent is given.
 */
const ALLOWED_HOSTS: Record<EmbedProvider, readonly string[]> = {
  google_maps: ['www.google.com', 'google.com', 'maps.google.com'],
  spotify: ['open.spotify.com'],
  youtube: ['www.youtube-nocookie.com', 'youtube-nocookie.com', 'www.youtube.com', 'youtube.com'],
  soundcloud: ['w.soundcloud.com'],
};

/** Per-provider iframe `allow` lists, rather than trusting whatever the pasted code asked for. */
export const IFRAME_ALLOW: Record<EmbedProvider, string | undefined> = {
  google_maps: undefined,
  spotify: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture',
  youtube: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
  soundcloud: 'autoplay',
};

/**
 * Pull the iframe src out of admin-pasted embed HTML.
 *
 * DOMParser builds an inert document: nothing in it loads or executes. The
 * previous approach (innerHTML on a detached div) would already fetch an
 * <img> in the pasted code — a third-party request before any consent.
 */
export function extractIframeSrc(embedHtml: string | null | undefined): string | null {
  if (!embedHtml?.trim()) return null;
  const doc = new DOMParser().parseFromString(embedHtml, 'text/html');
  return doc.querySelector('iframe')?.getAttribute('src') ?? null;
}

/**
 * Validate an embed URL for its provider and normalise it. YouTube is
 * rewritten to youtube-nocookie.com (privacy-enhanced mode). Returns null for
 * anything not on the provider's allowlist or not HTTPS.
 */
export function safeEmbedSrc(provider: EmbedProvider, rawSrc: string | null): string | null {
  if (!rawSrc) return null;
  let url: URL;
  try {
    url = new URL(rawSrc);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS[provider].includes(url.hostname)) return null;
  if (provider === 'google_maps' && !url.pathname.startsWith('/maps')) return null;
  if (provider === 'youtube') url.hostname = 'www.youtube-nocookie.com';
  return url.toString();
}
