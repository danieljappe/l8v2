import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ALL_CONSENT,
  NO_CONSENT,
  closeConsentSettings,
  saveConsent,
  type ConsentChoices,
} from './consentStore';
import { CONSENT_CATEGORIES, itemsInCategory, type ConsentCategory } from './registry';
import { useConsent, useSettingsOpen } from './useConsent';

// One class for every decision button. Accept and reject must carry equal
// visual weight (Datatilsynet); giving "Tilpas" the same weight keeps it simple.
const decisionButton =
  'flex-1 min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-semibold bg-white text-l8-dark ' +
  'hover:bg-white/85 transition-colors focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-l8-blue';

const toggleClass =
  "peer relative h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-white/25 transition-colors " +
  "checked:bg-l8-blue disabled:cursor-not-allowed disabled:opacity-60 " +
  "before:absolute before:left-0.5 before:top-0.5 before:h-5 before:w-5 before:rounded-full before:bg-white " +
  "before:transition-transform before:content-[''] checked:before:translate-x-5 " +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-l8-blue';

const CategoryRow: React.FC<{
  category: ConsentCategory;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ category, checked, onChange }) => {
  const inputId = useId();
  const descId = useId();
  const items = itemsInCategory(category.id);

  return (
    <li className="rounded-xl bg-white/5 p-4">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={inputId} className="font-semibold text-white">
          {category.title}
          {category.required && <span className="ml-2 text-xs font-normal text-white/60">(altid aktiv)</span>}
        </label>
        <input
          id={inputId}
          type="checkbox"
          role="switch"
          aria-describedby={descId}
          className={toggleClass}
          checked={category.required || checked}
          disabled={category.required}
          onChange={(e) => onChange(e.target.checked)}
        />
      </div>
      <p id={descId} className="mt-1 text-sm text-white/70">
        {category.description}
      </p>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-l8-blue-light hover:underline">
          Vis udbydere og lagring ({items.length})
        </summary>
        <ul className="mt-2 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-white/10 p-3 text-white/80">
              <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1">
                <dt className="text-white/50">Udbyder</dt>
                <dd>{item.provider}</dd>
                <dt className="text-white/50">Formål</dt>
                <dd>{item.purpose}</dd>
                <dt className="text-white/50">Navn</dt>
                <dd className={item.setBy === 'first_party' ? 'font-mono text-xs leading-5' : undefined}>
                  {item.names.join(', ')}
                </dd>
                <dt className="text-white/50">Type</dt>
                <dd>
                  {item.storageType === 'cookie' ? 'Cookie' : 'Lokal lagring'}
                  {item.setBy === 'third_party' ? ' (sættes af udbyderen)' : ''}
                </dd>
                <dt className="text-white/50">Varighed</dt>
                <dd>{item.duration}</dd>
                <dt className="text-white/50">Uden for EU/EØS</dt>
                <dd>{item.transfersOutsideEEA ? 'Ja, kan overføres' : 'Nej'}</dd>
              </dl>
              {item.privacyPolicyUrl && (
                <a
                  href={item.privacyPolicyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-l8-blue-light underline"
                >
                  Udbyderens privatlivspolitik
                </a>
              )}
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
};

/**
 * Two-layer consent banner. Non-modal on purpose: the site stays fully usable
 * without a choice (no cookie wall), and there is no close button, because
 * dismissing without choosing must not count as consent.
 */
const ConsentBanner: React.FC = () => {
  const consent = useConsent();
  const settingsOpen = useSettingsOpen();
  const visible = consent === null || settingsOpen;

  const [layer, setLayer] = useState<'first' | 'details'>('first');
  const [draft, setDraft] = useState<ConsentChoices>(NO_CONSENT);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  const descId = useId();

  useEffect(() => {
    if (!visible) return;
    // Re-opened from the footer: go straight to the toggles, showing the
    // current choice, so withdrawing is a single click away.
    setLayer(settingsOpen ? 'details' : 'first');
    setDraft(consent?.categories ?? NO_CONSENT);
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    // Re-opened on request: move focus in. On first visit focus is left alone —
    // the banner is rendered first in DOM order, so the first Tab reaches it.
    if (settingsOpen) headingRef.current?.focus();
    return () => {
      const target = returnFocusRef.current;
      if (target && document.contains(target)) target.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const showDetails = () => {
    setLayer('details');
    // The heading text changes with the layer; focusing it announces the switch.
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  if (!visible) return null;

  const decide = (choices: ConsentChoices) => saveConsent(choices);

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Escape only closes a re-opened banner, leaving the existing choice as-is.
    // On first visit there is nothing to fall back to, so it does nothing.
    if (e.key === 'Escape' && consent !== null) closeConsentSettings();
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-2 sm:p-4">
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby={headingId}
        aria-describedby={descId}
        onKeyDown={onKeyDown}
        className="pointer-events-auto max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-l8-dark/95 p-5 text-white shadow-2xl backdrop-blur-lg sm:p-6"
        data-testid="consent-banner"
      >
        <h2 id={headingId} ref={headingRef} tabIndex={-1} className="text-lg font-bold outline-none sm:text-xl">
          {layer === 'first' ? 'Må vi bruge cookies?' : 'Cookie-indstillinger'}
        </h2>

        <p id={descId} className="mt-2 text-sm text-white/80">
          Vi vil gerne bruge Google Analytics til anonym statistik og vise kort, musik og video fra Google
          Maps, Spotify, YouTube og SoundCloud. Det kræver dit samtykke. Siden virker fint uden. Du kan altid
          ændre dit valg under &quot;Cookie-indstillinger&quot; nederst på siden. Læs mere i vores{' '}
          <Link to="/privatlivspolitik" className="text-l8-blue-light underline">
            privatlivspolitik
          </Link>
          .
        </p>

        {layer === 'details' && (
          <ul className="mt-4 space-y-3" aria-label="Kategorier">
            {CONSENT_CATEGORIES.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                checked={category.id === 'necessary' ? true : draft[category.id]}
                onChange={(checked) =>
                  category.id !== 'necessary' && setDraft((d) => ({ ...d, [category.id]: checked }))
                }
              />
            ))}
          </ul>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button type="button" className={decisionButton} onClick={() => decide(NO_CONSENT)}>
            Afvis alle
          </button>
          {layer === 'first' ? (
            <button type="button" className={decisionButton} onClick={showDetails}>
              Tilpas
            </button>
          ) : (
            <button type="button" className={decisionButton} onClick={() => decide(draft)}>
              Gem valg
            </button>
          )}
          <button type="button" className={decisionButton} onClick={() => decide(ALL_CONSENT)}>
            Accepter alle
          </button>
        </div>

        {layer === 'details' && consent === null && (
          <button
            type="button"
            className="mt-3 text-sm text-white/70 underline hover:text-white"
            onClick={() => setLayer('first')}
          >
            Tilbage
          </button>
        )}
      </div>
    </div>
  );
};

export default ConsentBanner;
