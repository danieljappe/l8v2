/**
 * Converts a string to a URL-friendly slug
 * Handles special characters, Danish characters, and spaces
 */
export function slugify(text: string): string {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    // Replace Danish characters
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    // Replace special characters with their ASCII equivalents where possible
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    // Replace spaces and underscores with hyphens
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    // Remove all non-word characters except hyphens
    .replace(/[^\w\-]+/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/\-\-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Decodes a slug back to a searchable format
 * Useful for querying events by slugified title
 */
export function deslugify(slug: string): string {
  if (!slug) return '';
  
  return slug
    .replace(/-/g, ' ')
    .replace(/ae/g, 'æ')
    .replace(/oe/g, 'ø')
    .replace(/aa/g, 'å');
}

