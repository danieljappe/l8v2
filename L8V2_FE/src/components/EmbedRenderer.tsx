import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useHasConsent } from '../consent/useConsent';
import { IFRAME_ALLOW, extractIframeSrc, safeEmbedSrc } from '../consent/embedPolicy';
import ExternalContentPlaceholder from '../consent/ExternalContentPlaceholder';

interface EmbedRendererProps {
  embedCode: string;
  platform: 'spotify' | 'youtube' | 'soundcloud';
  title?: string;
  className?: string;
}

const HEIGHTS: Record<EmbedRendererProps['platform'], number> = {
  spotify: 352,
  youtube: 315,
  soundcloud: 300,
};

const EmbedRenderer: React.FC<EmbedRendererProps> = ({
  embedCode,
  platform,
  title,
  className = ''
}) => {
  const allowed = useHasConsent('external_media');
  const [isLoaded, setIsLoaded] = useState(false);
  const src = useMemo(() => safeEmbedSrc(platform, extractIframeSrc(embedCode)), [embedCode, platform]);
  const height = HEIGHTS[platform];

  if (!src) {
    return (
      <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center ${className}`}>
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-white font-medium mb-2">Failed to load embed</h3>
        <p className="text-white/60 text-sm">
          There was an error loading this {platform} embed. Please check the embed code.
        </p>
      </div>
    );
  }

  // No iframe, and so no request to the provider, until external media is allowed.
  if (!allowed) {
    return <ExternalContentPlaceholder provider={platform} height={height} className={className} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/5 backdrop-blur-sm rounded-xl p-0 border border-white/10 ${className}`}
    >
      <div className="relative" style={{ minHeight: `${height}px` }}>
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-lg">
            <div className="flex items-center space-x-2 text-white/60">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Loading...</span>
            </div>
          </div>
        )}
        <iframe
          src={src}
          title={title || `${platform} embed`}
          allow={IFRAME_ALLOW[platform]}
          allowFullScreen
          loading="lazy"
          // YouTube refuses to play without a referrer origin.
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setIsLoaded(true)}
          style={{ width: '100%', height: `${height}px`, border: 'none', borderRadius: '12px' }}
        />
      </div>
    </motion.div>
  );
};

export default EmbedRenderer;
