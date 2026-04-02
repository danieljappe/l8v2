import { Embedding } from '../models/Artist';

export interface EmbeddingValidationResult {
  isValid: boolean;
  platform?: 'spotify' | 'youtube' | 'soundcloud';
  sanitizedCode?: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  error?: string;
}

/**
 * Validates and sanitizes embedding code from various platforms
 */
export function validateAndSanitizeEmbedding(embedCode: string): EmbeddingValidationResult {
  if (!embedCode || typeof embedCode !== 'string') {
    return { isValid: false, error: 'Embed code is required' };
  }

  // Clean up the embed code
  const cleanCode = embedCode.trim();

  // Check for Spotify embed
  if (cleanCode.includes('open.spotify.com/embed')) {
    return validateSpotifyEmbed(cleanCode);
  }

  // Check for YouTube embed
  if (cleanCode.includes('youtube.com/embed') || cleanCode.includes('youtu.be')) {
    return validateYouTubeEmbed(cleanCode);
  }

  // Check for SoundCloud embed
  if (cleanCode.includes('soundcloud.com/player')) {
    return validateSoundCloudEmbed(cleanCode);
  }

  return { isValid: false, error: 'Unsupported platform. Only Spotify, YouTube, and SoundCloud are supported.' };
}

function validateSpotifyEmbed(embedCode: string): EmbeddingValidationResult {
  // Extract iframe src
  const srcMatch = embedCode.match(/src="([^"]+)"/);
  if (!srcMatch) {
    return { isValid: false, error: 'Invalid Spotify embed code - missing src attribute' };
  }

  const src = srcMatch[1];
  
  // Validate Spotify URL format
  if (!src.includes('open.spotify.com/embed')) {
    return { isValid: false, error: 'Invalid Spotify embed URL' };
  }

  // Extract track/album/playlist ID for title
  const idMatch = src.match(/\/embed\/(track|album|playlist)\/([^?]+)/);
  const type = idMatch?.[1] || 'track';
  const id = idMatch?.[2] || 'unknown';

  return {
    isValid: true,
    platform: 'spotify',
    sanitizedCode: embedCode,
    title: `Spotify ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    description: `Spotify ${type} embed`,
    thumbnailUrl: `https://i.scdn.co/image/${id}` // This might not work for all cases
  };
}

function validateYouTubeEmbed(embedCode: string): EmbeddingValidationResult {
  // Extract iframe src
  const srcMatch = embedCode.match(/src="([^"]+)"/);
  if (!srcMatch) {
    return { isValid: false, error: 'Invalid YouTube embed code - missing src attribute' };
  }

  const src = srcMatch[1];
  
  // Validate YouTube URL format
  if (!src.includes('youtube.com/embed') && !src.includes('youtu.be')) {
    return { isValid: false, error: 'Invalid YouTube embed URL' };
  }

  // Extract video ID
  const videoIdMatch = src.match(/(?:embed\/|youtu\.be\/)([^?&]+)/);
  const videoId = videoIdMatch?.[1] || 'unknown';

  // Extract title if available
  const titleMatch = embedCode.match(/title="([^"]+)"/);
  const title = titleMatch?.[1] || `YouTube Video`;

  return {
    isValid: true,
    platform: 'youtube',
    sanitizedCode: embedCode,
    title,
    description: 'YouTube video embed',
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  };
}

function validateSoundCloudEmbed(embedCode: string): EmbeddingValidationResult {
  // Extract iframe src
  const srcMatch = embedCode.match(/src="([^"]+)"/);
  if (!srcMatch) {
    return { isValid: false, error: 'Invalid SoundCloud embed code - missing src attribute' };
  }

  const src = srcMatch[1];
  
  // Validate SoundCloud URL format
  if (!src.includes('soundcloud.com/player')) {
    return { isValid: false, error: 'Invalid SoundCloud embed URL' };
  }

  // Extract URL parameter
  const urlMatch = src.match(/url=([^&]+)/);
  const encodedUrl = urlMatch?.[1];
  
  let title = 'SoundCloud Track';
  if (encodedUrl) {
    try {
      const decodedUrl = decodeURIComponent(encodedUrl);
      const trackMatch = decodedUrl.match(/soundcloud\.com\/([^\/]+)\/([^\/\?]+)/);
      if (trackMatch) {
        title = `SoundCloud: ${trackMatch[2].replace(/-/g, ' ')}`;
      }
    } catch (e) {
      // If decoding fails, use default title
    }
  }

  return {
    isValid: true,
    platform: 'soundcloud',
    sanitizedCode: embedCode,
    title,
    description: 'SoundCloud audio embed',
    thumbnailUrl: undefined // SoundCloud doesn't provide easy thumbnail access
  };
}

/**
 * Creates a new embedding object with validation
 */
export function createEmbedding(embedCode: string): Embedding | null {
  const validation = validateAndSanitizeEmbedding(embedCode);
  
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  return {
    id: generateEmbeddingId(),
    platform: validation.platform!,
    embedCode: validation.sanitizedCode!,
    title: validation.title,
    description: validation.description,
    thumbnailUrl: validation.thumbnailUrl,
    createdAt: new Date()
  };
}

/**
 * Generates a unique ID for embeddings
 */
function generateEmbeddingId(): string {
  return `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitizes HTML to prevent XSS attacks
 */
export function sanitizeEmbedCode(embedCode: string): string {
  // Remove any script tags and potentially dangerous attributes
  let sanitized = embedCode
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/data:text\/html/gi, ''); // Remove data URLs

  // Ensure it's an iframe
  if (!sanitized.includes('<iframe')) {
    throw new Error('Only iframe embeds are allowed');
  }

  return sanitized;
}
