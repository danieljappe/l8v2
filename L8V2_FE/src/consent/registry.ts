/**
 * Single source of truth for everything the site stores on, or loads into, the
 * visitor's browser beyond what is strictly necessary.
 *
 * The banner's second layer and the cookie table on /privatlivspolitik are both
 * rendered from this file. Adding a tracker, embed or storage key anywhere in
 * the frontend without adding it here is a bug: it would load without the
 * visitor having been told about it.
 */

/**
 * Bump whenever a category or item is added, removed or materially changed
 * (new vendor, new purpose, longer duration). Every stored choice made under an
 * older version is treated as absent, so the visitor is asked again.
 */
export const CONSENT_VERSION = 1;

/** Re-prompt after 12 months, per Datatilsynet's guidance on consent lifetime. */
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

/** localStorage key holding the visitor's choice. Listed below as a necessary item. */
export const CONSENT_STORAGE_KEY = 'l8-consent';

export type ConsentCategoryId = 'necessary' | 'statistics' | 'external_media';
export type OptionalCategoryId = Exclude<ConsentCategoryId, 'necessary'>;

export const OPTIONAL_CATEGORIES: readonly OptionalCategoryId[] = ['statistics', 'external_media'];

export interface ConsentCategory {
  id: ConsentCategoryId;
  title: string;
  description: string;
  /** Always on and not toggleable. Only for storage that is strictly necessary. */
  required: boolean;
}

export type RegistryItemId =
  | 'consent_choice'
  | 'admin_auth_token'
  | 'google_analytics'
  | 'google_maps'
  | 'spotify'
  | 'youtube'
  | 'soundcloud';

export interface RegistryItem {
  id: RegistryItemId;
  category: ConsentCategoryId;
  provider: string;
  /** Danish, shown to visitors. */
  purpose: string;
  storageType: 'cookie' | 'localStorage';
  /** Whether l8events.dk writes it, or the provider does from inside its own frame/script. */
  setBy: 'first_party' | 'third_party';
  names: string[];
  duration: string;
  transfersOutsideEEA: boolean;
  privacyPolicyUrl?: string;
}

export const CONSENT_CATEGORIES: readonly ConsentCategory[] = [
  {
    id: 'necessary',
    title: 'Nødvendige',
    description:
      'Gemmer dit cookievalg og holder administratorer logget ind. Siden kan ikke fungere uden, så de kan ikke fravælges.',
    required: true,
  },
  {
    id: 'statistics',
    title: 'Statistik',
    description:
      'Hjælper os med at forstå, hvordan siden bruges, via Google Analytics. Indlæses kun, hvis du siger ja.',
    required: false,
  },
  {
    id: 'external_media',
    title: 'Eksternt indhold',
    description:
      'Kort fra Google Maps og musik/video fra Spotify, YouTube og SoundCloud. Udbyderne sætter egne cookies og modtager bl.a. din IP-adresse, når indholdet vises.',
    required: false,
  },
];

export const CONSENT_REGISTRY: readonly RegistryItem[] = [
  // ── necessary ──────────────────────────────────────────────────────────────
  {
    id: 'consent_choice',
    category: 'necessary',
    provider: 'L8 Events',
    purpose: 'Husker dit cookievalg, så vi ikke spørger igen ved hvert besøg.',
    storageType: 'localStorage',
    setBy: 'first_party',
    names: [CONSENT_STORAGE_KEY],
    duration: '12 måneder',
    transfersOutsideEEA: false,
  },
  {
    id: 'admin_auth_token',
    category: 'necessary',
    provider: 'L8 Events',
    purpose: 'Holder administratorer logget ind. Sættes kun ved login på administrationssiden.',
    storageType: 'localStorage',
    setBy: 'first_party',
    names: ['token'],
    duration: 'Indtil logud, højst 1 døgn',
    transfersOutsideEEA: false,
  },

  // ── statistics ─────────────────────────────────────────────────────────────
  {
    id: 'google_analytics',
    category: 'statistics',
    provider: 'Google Ireland Ltd. (Google Analytics 4)',
    purpose: 'Anonym statistik over sidevisninger og brug af siden.',
    storageType: 'cookie',
    setBy: 'first_party',
    names: ['_ga', '_ga_<id>'],
    duration: '2 år',
    transfersOutsideEEA: true,
    privacyPolicyUrl: 'https://policies.google.com/privacy',
  },

  // ── external_media ─────────────────────────────────────────────────────────
  {
    id: 'google_maps',
    category: 'external_media',
    provider: 'Google Ireland Ltd. (Google Maps)',
    purpose: 'Viser kort over spillestedet på eventsider.',
    storageType: 'cookie',
    setBy: 'third_party',
    names: ['Fastsat af Google'],
    duration: 'Fastsat af Google',
    transfersOutsideEEA: true,
    privacyPolicyUrl: 'https://policies.google.com/privacy',
  },
  {
    id: 'spotify',
    category: 'external_media',
    provider: 'Spotify AB',
    purpose: 'Afspiller kunstneres musik på kunstnersider.',
    storageType: 'cookie',
    setBy: 'third_party',
    names: ['Fastsat af Spotify'],
    duration: 'Fastsat af Spotify',
    transfersOutsideEEA: true,
    privacyPolicyUrl: 'https://www.spotify.com/dk-da/legal/privacy-policy/',
  },
  {
    id: 'youtube',
    category: 'external_media',
    provider: 'Google Ireland Ltd. (YouTube, udvidet privatlivstilstand)',
    purpose: 'Afspiller kunstneres videoer på kunstnersider.',
    storageType: 'cookie',
    setBy: 'third_party',
    names: ['Fastsat af YouTube'],
    duration: 'Fastsat af YouTube',
    transfersOutsideEEA: true,
    privacyPolicyUrl: 'https://policies.google.com/privacy',
  },
  {
    id: 'soundcloud',
    category: 'external_media',
    provider: 'SoundCloud Global Limited & Co. KG',
    purpose: 'Afspiller kunstneres musik på kunstnersider.',
    storageType: 'cookie',
    setBy: 'third_party',
    names: ['Fastsat af SoundCloud'],
    duration: 'Fastsat af SoundCloud',
    transfersOutsideEEA: true,
    privacyPolicyUrl: 'https://soundcloud.com/pages/privacy',
  },
];

export function getRegistryItem(id: RegistryItemId): RegistryItem {
  const item = CONSENT_REGISTRY.find((i) => i.id === id);
  if (!item) throw new Error(`Unknown consent registry item: ${id}`);
  return item;
}

export function itemsInCategory(category: ConsentCategoryId): RegistryItem[] {
  return CONSENT_REGISTRY.filter((i) => i.category === category);
}

/** Short provider name for placeholders, e.g. "Google Maps" rather than the legal entity. */
export const EMBED_DISPLAY_NAMES: Record<'google_maps' | 'spotify' | 'youtube' | 'soundcloud', string> = {
  google_maps: 'Google Maps',
  spotify: 'Spotify',
  youtube: 'YouTube',
  soundcloud: 'SoundCloud',
};
