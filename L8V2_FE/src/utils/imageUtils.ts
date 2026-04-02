// Utility function to construct full URLs from relative paths
export const constructFullUrl = (relativeUrl: string | null | undefined): string => {
  if (!relativeUrl) {
    return '';
  }
  
  if (relativeUrl.startsWith('http')) {
    return relativeUrl;
  }
  
  // Option 1: Use environment variable (recommended)
  if (import.meta.env.VITE_BACKEND_URL) {
    const fullUrl = `${import.meta.env.VITE_BACKEND_URL}${relativeUrl}`;
    return fullUrl;
  }
  
  // Option 2: Auto-detect from current domain
  const currentOrigin = window.location.origin;
  
  if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
    // In development, use relative URL (Vite proxy handles it)
    return relativeUrl;
  }
  
  // Option 3: Use production backend URL from environment or fallback
  const productionBackend = import.meta.env.VITE_PRODUCTION_BACKEND_URL || 'https://l8events.dk';
  const fullUrl = `${productionBackend}${relativeUrl}`;
  return fullUrl;
};

// Utility function to get the best available image URL from a gallery image
export const getBestImageUrl = (image: any): string => {
  // Prefer thumbnail for small displays, medium for medium displays, large for large displays
  if (image.thumbnailUrl) return constructFullUrl(image.thumbnailUrl);
  if (image.mediumUrl) return constructFullUrl(image.mediumUrl);
  if (image.largeUrl) return constructFullUrl(image.largeUrl);
  if (image.url) return constructFullUrl(image.url);
  return '';
};
