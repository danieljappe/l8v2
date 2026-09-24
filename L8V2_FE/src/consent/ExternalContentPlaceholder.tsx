import React from 'react';
import { grantCategory, openConsentSettings } from './consentStore';
import { EMBED_DISPLAY_NAMES } from './registry';
import type { EmbedProvider } from './embedPolicy';

interface Props {
  provider: EmbedProvider;
  height: number;
  className?: string;
}

/**
 * Stands in for a third-party iframe until `external_media` is granted. Makes
 * no request to the provider: no thumbnail, no preconnect, nothing.
 */
const ExternalContentPlaceholder: React.FC<Props> = ({ provider, height, className = '' }) => {
  const name = EMBED_DISPLAY_NAMES[provider];
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white ${className}`}
      style={{ minHeight: `${height}px` }}
      data-testid={`embed-placeholder-${provider}`}
    >
      <p className="font-semibold">Indhold fra {name}</p>
      <p className="max-w-md text-sm text-white/70">
        Når du viser det, sætter {name} cookies og modtager bl.a. din IP-adresse, som kan blive overført til
        lande uden for EU/EØS. Det slår eksternt indhold til på hele siden.
      </p>
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
        <button
          type="button"
          onClick={() => grantCategory('external_media')}
          className="min-h-[44px] rounded-lg bg-white px-4 py-2 text-sm font-semibold text-l8-dark hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-l8-blue"
        >
          Vis indhold
        </button>
        <button
          type="button"
          onClick={openConsentSettings}
          className="text-sm text-white/70 underline hover:text-white"
        >
          Cookie-indstillinger
        </button>
      </div>
    </div>
  );
};

export default ExternalContentPlaceholder;
