import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Youtube, Volume2, AlertCircle } from 'lucide-react';

interface EmbedRendererProps {
  embedCode: string;
  platform: 'spotify' | 'youtube' | 'soundcloud';
  title?: string;
  className?: string;
}

const EmbedRenderer: React.FC<EmbedRendererProps> = ({ 
  embedCode, 
  platform, 
  title, 
  className = '' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (containerRef.current && embedCode) {
      // Clear previous content
      containerRef.current.innerHTML = '';
      
      // Create a temporary div to parse the embed code
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = embedCode;
      
      // Find the iframe
      const iframe = tempDiv.querySelector('iframe');
      if (iframe) {
        // Sanitize the iframe attributes
        const sanitizedIframe = document.createElement('iframe');
        
        // Copy safe attributes
        const safeAttributes = ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'allow', 'loading', 'title'];
        safeAttributes.forEach(attr => {
          if (iframe.hasAttribute(attr)) {
            sanitizedIframe.setAttribute(attr, iframe.getAttribute(attr) || '');
          }
        });
        
        // Set default attributes for better responsiveness
        sanitizedIframe.style.width = '100%';
        sanitizedIframe.style.height = 'auto';
        sanitizedIframe.style.borderRadius = '12px';
        sanitizedIframe.style.border = 'none';
        
        // Set platform-specific heights
        switch (platform) {
          case 'spotify':
            sanitizedIframe.style.height = '352px';
            break;
          case 'youtube':
            sanitizedIframe.style.height = '315px';
            break;
          case 'soundcloud':
            sanitizedIframe.style.height = '300px';
            break;
        }
        
        // Add loading and error handlers
        sanitizedIframe.onload = () => setIsLoaded(true);
        sanitizedIframe.onerror = () => setHasError(true);
        
        containerRef.current.appendChild(sanitizedIframe);
      } else {
        setHasError(true);
      }
    }
  }, [embedCode, platform]);

  const getPlatformIcon = () => {
    switch (platform) {
      case 'spotify':
        return <Music className="w-100 h-8 text-green-500" />;
      case 'youtube':
        return <Youtube className="w-8 h-8 text-red-500" />;
      case 'soundcloud':
        return <Volume2 className="w-8 h-8 text-orange-500" />;
      default:
        return <Music className="w-8 h-8 text-gray-500" />;
    }
  };

  if (hasError) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/5 backdrop-blur-sm rounded-xl p-0 border border-white/10 ${className}`}
    >
      <div className="relative">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-lg">
            <div className="flex items-center space-x-2 text-white/60">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Loading...</span>
            </div>
          </div>
        )}
        
        <div 
          ref={containerRef}
          className="w-full"
          style={{ minHeight: platform === 'spotify' ? '352px' : platform === 'youtube' ? '315px' : '300px' }}
        />
      </div>
    </motion.div>
  );
};

export default EmbedRenderer;
