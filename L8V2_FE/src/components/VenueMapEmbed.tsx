import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface VenueMapEmbedProps {
  embedHtml?: string | null;
  title?: string;
  className?: string;
  height?: number;
}

const SAFE_ATTRIBUTES = ['src', 'referrerpolicy', 'loading', 'allowfullscreen'] as const;

const VenueMapEmbed: React.FC<VenueMapEmbedProps> = ({
  embedHtml,
  title = 'Venue location',
  className = '',
  height = 320
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    containerRef.current.innerHTML = '';
    setHasError(false);

    if (!embedHtml || embedHtml.trim().length === 0) {
      setIsLoading(false);
      return;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = embedHtml.trim();
    const iframe = tempDiv.querySelector('iframe');

    if (!iframe) {
      setHasError(true);
      return;
    }

    const sanitizedIframe = document.createElement('iframe');

    SAFE_ATTRIBUTES.forEach((attr) => {
      if (iframe.hasAttribute(attr)) {
        sanitizedIframe.setAttribute(attr, iframe.getAttribute(attr) || '');
      }
    });

    sanitizedIframe.setAttribute('title', title);
    sanitizedIframe.setAttribute('loading', sanitizedIframe.getAttribute('loading') || 'lazy');
    sanitizedIframe.setAttribute('referrerpolicy', sanitizedIframe.getAttribute('referrerpolicy') || 'no-referrer-when-downgrade');
    sanitizedIframe.setAttribute('allowfullscreen', '');
    sanitizedIframe.style.border = '0';
    sanitizedIframe.style.width = '100%';
    sanitizedIframe.style.height = `${height}px`;
    sanitizedIframe.style.borderRadius = '16px';

    setIsLoading(true);
    sanitizedIframe.onload = () => setIsLoading(false);
    sanitizedIframe.onerror = () => {
      setIsLoading(false);
      setHasError(true);
    };

    containerRef.current.appendChild(sanitizedIframe);
  }, [embedHtml, title, height]);

  return (
    <div className={`relative ${className}`}>
      {!embedHtml && (
        <div className="flex items-center justify-center w-full min-h-[200px] text-sm text-gray-500 dark:text-gray-300">
          <span className="italic">No map embed provided</span>
        </div>
      )}

      {embedHtml && (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-10 rounded-2xl">
              <div className="flex items-center space-x-2 text-white/80">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">Loading map…</span>
              </div>
            </div>
          )}
          <div
            ref={containerRef}
            className="w-full rounded-2xl overflow-hidden"
            style={{ minHeight: `${height}px` }}
          />
        </>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white rounded-2xl z-20 text-center px-4">
          <AlertCircle className="w-6 h-6 mb-2 text-red-300" />
          <p className="text-sm font-medium">Unable to load map preview</p>
          <p className="text-xs text-white/70 mt-1">
            Please verify that the Google Maps iframe code is correct.
          </p>
        </div>
      )}
    </div>
  );
};

export default VenueMapEmbed;

