import React, { useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useHasConsent } from '../consent/useConsent';
import { extractIframeSrc, safeEmbedSrc } from '../consent/embedPolicy';
import ExternalContentPlaceholder from '../consent/ExternalContentPlaceholder';

interface VenueMapEmbedProps {
  embedHtml?: string | null;
  title?: string;
  className?: string;
  height?: number;
}

const VenueMapEmbed: React.FC<VenueMapEmbedProps> = ({
  embedHtml,
  title = 'Venue location',
  className = '',
  height = 320
}) => {
  const allowed = useHasConsent('external_media');
  const [isLoading, setIsLoading] = useState(true);
  const src = useMemo(() => safeEmbedSrc('google_maps', extractIframeSrc(embedHtml)), [embedHtml]);

  if (!embedHtml) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center justify-center w-full min-h-[200px] text-sm text-gray-500 dark:text-gray-300">
          <span className="italic">No map embed provided</span>
        </div>
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-black/80 text-white rounded-2xl text-center px-4 ${className}`}
        style={{ minHeight: `${height}px` }}
      >
        <AlertCircle className="w-6 h-6 mb-2 text-red-300" />
        <p className="text-sm font-medium">Unable to load map preview</p>
        <p className="text-xs text-white/70 mt-1">
          Please verify that the Google Maps iframe code is correct.
        </p>
      </div>
    );
  }

  // No iframe, and so no request to Google, until external media is allowed.
  if (!allowed) {
    return <ExternalContentPlaceholder provider="google_maps" height={height} className={className} />;
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-10 rounded-2xl">
          <div className="flex items-center space-x-2 text-white/80">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Loading map…</span>
          </div>
        </div>
      )}
      <iframe
        src={src}
        title={title}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        onLoad={() => setIsLoading(false)}
        className="w-full rounded-2xl"
        style={{ border: 0, height: `${height}px` }}
      />
    </div>
  );
};

export default VenueMapEmbed;
