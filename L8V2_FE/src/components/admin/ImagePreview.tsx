import React, { useState, useEffect } from 'react';
import { constructFullUrl } from '../../utils/imageUtils';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImagePreviewProps {
  src: string;
  alt: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showOverlay?: boolean;
  overlayText?: string;
  overlaySubtext?: string;
  clickable?: boolean;
  // New props for gallery navigation
  allImages?: Array<{ src: string; alt: string; id?: string }>;
  currentImageIndex?: number;
  onImageChange?: (index: number) => void;
}

export default function ImagePreview({ 
  src, 
  alt, 
  size = 'medium', 
  className = '',
  showOverlay = false,
  overlayText,
  overlaySubtext,
  clickable = false,
  allImages,
  currentImageIndex = 0,
  onImageChange
}: ImagePreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(currentImageIndex);
  
  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-32 h-32',
    large: 'w-full h-full'
  };

  const handleImageClick = () => {
    if (clickable) {
      setShowPreview(true);
      // Set the current index when opening preview
      if (allImages && onImageChange) {
        const index = allImages.findIndex(img => img.src === src);
        if (index !== -1) {
          setCurrentIndex(index);
          onImageChange(index);
        }
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && showPreview) {
      setShowPreview(false);
    } else if (showPreview && allImages && allImages.length > 1) {
      if (e.key === 'ArrowLeft') {
        navigateToPrevious();
      } else if (e.key === 'ArrowRight') {
        navigateToNext();
      }
    }
  };

  const navigateToPrevious = () => {
    if (allImages && allImages.length > 1) {
      const newIndex = currentIndex > 0 ? currentIndex - 1 : allImages.length - 1;
      setCurrentIndex(newIndex);
      if (onImageChange) {
        onImageChange(newIndex);
      }
    }
  };

  const navigateToNext = () => {
    if (allImages && allImages.length > 1) {
      const newIndex = currentIndex < allImages.length - 1 ? currentIndex + 1 : 0;
      setCurrentIndex(newIndex);
      if (onImageChange) {
        onImageChange(newIndex);
      }
    }
  };

  useEffect(() => {
    if (showPreview) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showPreview, currentIndex]);

  // Update current index when prop changes
  useEffect(() => {
    setCurrentIndex(currentImageIndex);
  }, [currentImageIndex]);

  return (
    <>
      <div 
        className={`relative ${sizeClasses[size]} ${className} ${clickable ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
        onClick={handleImageClick}
        style={{ '--tw-space-x-reverse': '' }}
      >
        <img
          src={constructFullUrl(src)}
          alt={alt}
          className={`w-full h-full object-cover ${size === 'large' ? '' : 'rounded-lg border border-gray-300'}`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        {showOverlay && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
            <div className="text-white text-center bg-black bg-opacity-50 px-3 py-2 rounded">
              {overlayText && <div className="text-sm">{overlayText}</div>}
              {overlaySubtext && <div className="text-xs">{overlaySubtext}</div>}
            </div>
          </div>
        )}
        {clickable && (
          <div className={`absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 ${size === 'large' ? '' : 'rounded-lg'} flex items-center justify-center`}>
            <div className="text-white text-xs opacity-0 hover:opacity-100 transition-opacity">
              Click to preview
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" style={{ '--tw-space-x-reverse': '' }} onClick={() => setShowPreview(false)}>
          <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-colors z-10 backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation buttons - only show if there are multiple images */}
            {allImages && allImages.length > 1 && (
              <>
                <button
                  onClick={navigateToPrevious}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-colors z-10 backdrop-blur-sm"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={navigateToNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-colors z-10 backdrop-blur-sm"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img
                src={constructFullUrl(allImages ? allImages[currentIndex].src : src)}
                alt={allImages ? allImages[currentIndex].alt : alt}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                style={{ maxHeight: 'calc(100vh - 80px)' }}
              />
            </div>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center bg-black bg-opacity-50 backdrop-blur-sm px-4 py-2 rounded-lg">
              <p className="text-white text-sm font-medium">
                {allImages ? allImages[currentIndex].alt : alt}
              </p>
              <p className="text-gray-300 text-xs mt-1">
                {allImages && allImages.length > 1 
                  ? `Image ${currentIndex + 1} of ${allImages.length} • Use arrow keys or click buttons to navigate`
                  : 'Click outside or press ESC to close'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
