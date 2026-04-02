/**
 * Utility functions for handling social media data conversion
 */

export interface SocialMediaItem {
  platform: string;
  url: string;
}

/**
 * Converts social media data from various formats to a consistent array format
 * Handles both old string formats and new array formats
 */
export function normalizeSocialMedia(socialMedia: any): SocialMediaItem[] {
  if (!socialMedia) {
    return [];
  }

  // If it's already an array, return it
  if (Array.isArray(socialMedia)) {
    return socialMedia;
  }

  // If it's a string, try to parse it
  if (typeof socialMedia === 'string') {
    const socialMediaString = socialMedia.trim();
    if (!socialMediaString) {
      return [];
    }

    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(socialMediaString);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      // If it's not an array, treat as legacy single entry
      return [{ platform: 'Legacy', url: socialMediaString }];
    } catch {
      // If JSON parsing fails, treat as legacy single entry
      return [{ platform: 'Legacy', url: socialMediaString }];
    }
  }

  // If it's any other type, return empty array
  return [];
}

/**
 * Converts social media array back to the format expected by the API
 */
export function serializeSocialMedia(socialMedia: SocialMediaItem[]): SocialMediaItem[] {
  return socialMedia.filter(item => 
    item.platform.trim() !== '' && item.url.trim() !== ''
  );
}
