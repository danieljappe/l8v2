// Image SEO utilities for better search engine optimization

export interface ImageSEOProps {
  src: string;
  alt: string;
  title?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
}

/**
 * Generate SEO-friendly alt text for artist images
 */
export const generateArtistAltText = (artistName: string, genre?: string): string => {
  return `${artistName}${genre ? ` - ${genre} DJ/Producer` : ' - DJ/Producer'} at L8 Events`;
};

/**
 * Generate SEO-friendly alt text for event images
 */
export const generateEventAltText = (eventTitle: string, venue?: string): string => {
  return `${eventTitle}${venue ? ` at ${venue}` : ''} - L8 Events`;
};

/**
 * Generate SEO-friendly alt text for gallery images
 */
export const generateGalleryAltText = (description?: string): string => {
  return description || 'L8 Events gallery - Electronic music event photos';
};

/**
 * Get optimized image props for SEO
 */
export const getOptimizedImageProps = (
  src: string,
  alt: string,
  options: Partial<ImageSEOProps> = {}
): ImageSEOProps => {
  return {
    src,
    alt,
    loading: 'lazy',
    ...options
  };
};

/**
 * Generate structured data for images
 */
export const createImageSchema = (imageUrl: string, alt: string, caption?: string) => ({
  "@type": "ImageObject",
  "url": imageUrl,
  "caption": caption || alt,
  "description": alt
});

// Common image dimensions for different use cases
export const IMAGE_DIMENSIONS = {
  artist: { width: 400, height: 400 },
  event: { width: 800, height: 600 },
  gallery: { width: 1200, height: 800 },
  thumbnail: { width: 200, height: 200 }
} as const;
