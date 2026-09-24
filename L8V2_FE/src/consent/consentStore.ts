import {
  CONSENT_MAX_AGE_MS,
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  OPTIONAL_CATEGORIES,
  type ConsentCategoryId,
  type OptionalCategoryId,
} from './registry';

export type ConsentChoices = Record<OptionalCategoryId, boolean>;

export interface StoredConsent {
  /** Random id linking this browser's consent events in the backend proof log. */
  id: string;
  version: number;
  /** ISO timestamp of the decision. */
  decidedAt: string;
  categories: ConsentChoices;
}

/** Keys written by the previous banner. Their choices predate this version and are discarded. */
const LEGACY_KEYS = ['cookieConsent', 'cookieConsentDate'];

export const NO_CONSENT: ConsentChoices = { statistics: false, external_media: false };
export const ALL_CONSENT: ConsentChoices = { statistics: true, external_media: true };

type Listener = () => void;
const listeners = new Set<Listener>();

let settingsOpen = false;
let cached: { raw: string | null; parsed: StoredConsent | null } | undefined;

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function emit() {
  cached = undefined;
  listeners.forEach((l) => l());
}

function parse(raw: string | null): StoredConsent | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<StoredConsent>;
    if (typeof data.id !== 'string' || typeof data.decidedAt !== 'string') return null;
    if (data.version !== CONSENT_VERSION) return null;
    if (Number.isNaN(Date.parse(data.decidedAt))) return null;
    const categories = {} as ConsentChoices;
    for (const cat of OPTIONAL_CATEGORIES) {
      // Anything but an explicit `true` is a refusal: no pre-ticked defaults.
      categories[cat] = data.categories?.[cat] === true;
    }
    return { id: data.id, version: data.version, decidedAt: data.decidedAt, categories };
  } catch {
    return null;
  }
}

/**
 * The visitor's currently valid choice, or null if they have not chosen, chose
 * under an older CONSENT_VERSION, or chose more than 12 months ago.
 *
 * Returns a referentially stable object between writes so it can back
 * useSyncExternalStore without re-render loops.
 */
export function readConsent(now: number = Date.now()): StoredConsent | null {
  const raw = safeGet(CONSENT_STORAGE_KEY);
  if (!cached || cached.raw !== raw) cached = { raw, parsed: parse(raw) };
  const parsed = cached.parsed;
  // Checked on every read, outside the cache: a tab left open can cross the line.
  if (parsed && now - Date.parse(parsed.decidedAt) > CONSENT_MAX_AGE_MS) return null;
  return parsed;
}

export function hasConsent(category: ConsentCategoryId): boolean {
  if (category === 'necessary') return true;
  return readConsent()?.categories[category] === true;
}

function newConsentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // RFC 4122 v4 from getRandomValues, for older Safari without randomUUID.
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Reuse the browser's existing id (even from an expired record) so a withdrawal links to the grant. */
function existingId(): string | null {
  try {
    const raw = safeGet(CONSENT_STORAGE_KEY);
    const id = raw ? (JSON.parse(raw) as { id?: unknown }).id : null;
    return typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  } catch {
    return null;
  }
}

export type ConsentChangeListener = (next: StoredConsent, previous: StoredConsent | null) => void;
const changeListeners = new Set<ConsentChangeListener>();

/** Side-effect hook (GA loading, proof logging). Fires only on an actual save in this tab. */
export function onConsentChange(listener: ConsentChangeListener): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

export function saveConsent(choices: ConsentChoices, now: Date = new Date()): StoredConsent {
  const previous = readConsent(now.getTime());
  const record: StoredConsent = {
    id: existingId() ?? newConsentId(),
    version: CONSENT_VERSION,
    decidedAt: now.toISOString(),
    categories: { ...NO_CONSENT, ...choices },
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage blocked (private mode etc.): the choice still applies for this page view.
  }
  settingsOpen = false;
  emit();
  changeListeners.forEach((l) => l(record, previous));
  return record;
}

/** Grant one category, keeping the rest of the visitor's existing choice. */
export function grantCategory(category: OptionalCategoryId): StoredConsent {
  const current = readConsent()?.categories ?? NO_CONSENT;
  return saveConsent({ ...current, [category]: true });
}

export function isSettingsOpen(): boolean {
  return settingsOpen;
}

export function openConsentSettings(): void {
  settingsOpen = true;
  emit();
}

/** Close a re-opened banner without changing anything. Only meaningful when a valid choice exists. */
export function closeConsentSettings(): void {
  settingsOpen = false;
  emit();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Drop the previous banner's keys; they recorded a "marketing" category that never existed. */
export function removeLegacyConsentKeys(): void {
  try {
    LEGACY_KEYS.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

if (typeof window !== 'undefined') {
  // Keep tabs in sync: a choice made in one tab applies to the others.
  window.addEventListener('storage', (e) => {
    if (e.key === CONSENT_STORAGE_KEY) emit();
  });
}
