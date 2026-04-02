# Sitemap Guide for L8v2 Frontend

This guide explains the sitemap functionality implemented for the L8v2 frontend application.

## Overview

The sitemap system automatically generates a comprehensive `sitemap.xml` file that includes:
- Static pages (home, events, artists, gallery, booking, etc.)
- Dynamic event pages (fetched from the API)
- Dynamic artist pages for the booking platform
- Proper SEO metadata (lastmod, changefreq, priority)

## Files

### Core Files
- `scripts/generate-sitemap.js` - Main sitemap generation script
- `src/utils/sitemap.ts` - Utility functions for sitemap generation
- `public/sitemap.xml` - Generated sitemap file (auto-generated)
- `public/robots.txt` - Robots.txt file that references the sitemap

### Generated Sitemap Structure

The sitemap includes the following URL patterns:

#### Static Pages
- `/` (priority: 1.0, changefreq: weekly)
- `/home` (priority: 0.9, changefreq: weekly)
- `/events` (priority: 0.9, changefreq: daily)
- `/artists` (priority: 0.8, changefreq: weekly)
- `/gallery` (priority: 0.7, changefreq: weekly)
- `/booking` (priority: 0.8, changefreq: monthly)
- `/booking/artists` (priority: 0.7, changefreq: monthly)
- `/booking/contact` (priority: 0.6, changefreq: monthly)
- `/about` (priority: 0.6, changefreq: monthly)
- `/contact` (priority: 0.6, changefreq: monthly)

#### Dynamic Pages
- `/events/{event-name-slug}` - Individual event pages (priority: 0.8, changefreq: weekly)
- `/booking/artists/{artist-slug}` - Individual artist pages for booking (priority: 0.7, changefreq: monthly)

## Usage

### Manual Generation
```bash
npm run generate-sitemap
```

### Automatic Generation
The sitemap is automatically generated during the build process:
```bash
npm run build
npm run build:events
npm run build:booking
```

### Development
For development, you can run the sitemap generation script manually when you want to update the sitemap with new content.

## Configuration

### API Endpoint
The sitemap generator fetches dynamic content from the API. The API URL is configured in `scripts/generate-sitemap.js`:

```javascript
const API_BASE_URL = process.env.VITE_API_URL || 'https://l8events.dk/api';
```

### Environment Variables
- `VITE_API_URL` - Override the API base URL for different environments

## SEO Features

### Priority System
- Homepage: 1.0 (highest priority)
- Main sections (events, artists): 0.8-0.9
- Secondary pages: 0.6-0.7
- Dynamic content: 0.7-0.8

### Change Frequency
- Events: Daily (frequently updated content)
- Artists/Gallery: Weekly
- Static pages: Monthly
- Booking pages: Monthly

### Last Modified Dates
- Static pages: Current date
- Dynamic pages: Uses `updatedAt` from API data

## Search Engine Integration

### Robots.txt
The `robots.txt` file properly references the sitemap:
```
Sitemap: https://l8events.dk/sitemap.xml
```

### Disallowed Pages
The following pages are excluded from crawling:
- `/admin/` - Admin interface
- `/login` - Login page

## Maintenance

### Regular Updates
The sitemap should be regenerated when:
- New events are added
- New artists are added
- New static pages are created
- Content is significantly updated

### Monitoring
Check the sitemap generation output for:
- Number of URLs generated
- API connection status
- Any errors during generation

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check if the backend API is running
   - Verify the API_BASE_URL configuration
   - Check network connectivity

2. **Empty Dynamic Content**
   - Ensure the API endpoints return data
   - Check API response format
   - Verify authentication if required

3. **Invalid URLs**
   - Check for special characters in artist names
   - Ensure proper URL encoding
   - Validate event/artist IDs

### Debug Mode
Add console.log statements in `scripts/generate-sitemap.js` to debug:
- API responses
- URL generation
- Data processing

## Future Enhancements

Potential improvements to consider:
- Add image sitemaps for gallery content
- Include video sitemaps for embedded content
- Add hreflang support for internationalization
- Implement sitemap indexing for large sites
- Add automatic sitemap submission to search engines

