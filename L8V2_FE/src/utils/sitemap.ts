interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export const generateSitemap = (entries: SitemapEntry[]): string => {
  const baseUrl = 'https://l8events.dk';
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  entries.forEach(entry => {
    const fullUrl = entry.url.startsWith('http') ? entry.url : `${baseUrl}${entry.url}`;
    const lastmod = entry.lastmod || new Date().toISOString().split('T')[0];
    const changefreq = entry.changefreq || 'weekly';
    const priority = entry.priority || 0.5;

    sitemap += `
  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  sitemap += `
</urlset>`;

  return sitemap;
};

export const getStaticPages = (): SitemapEntry[] => [
  {
    url: '/',
    changefreq: 'weekly',
    priority: 1.0
  },
  {
    url: '/home',
    changefreq: 'weekly',
    priority: 0.9
  },
  {
    url: '/events',
    changefreq: 'daily',
    priority: 0.9
  },
  {
    url: '/artists',
    changefreq: 'weekly',
    priority: 0.8
  },
  {
    url: '/gallery',
    changefreq: 'weekly',
    priority: 0.7
  },
  {
    url: '/booking',
    changefreq: 'weekly',
    priority: 0.9
  },
  {
    url: '/booking/artists',
    changefreq: 'monthly',
    priority: 0.7
  },
  {
    url: '/booking/contact',
    changefreq: 'monthly',
    priority: 0.6
  },
  {
    url: '/about',
    changefreq: 'monthly',
    priority: 0.8
  },
  {
    url: '/contact',
    changefreq: 'monthly',
    priority: 0.6
  }
];

// Simple slugify function for sitemap generation
const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export const addDynamicPages = (events: any[], artists: any[]): SitemapEntry[] => {
  const dynamicPages: SitemapEntry[] = [];

  // Add event pages
  events.forEach(event => {
    dynamicPages.push({
      url: `/events/${slugify(event.title)}`,
      lastmod: event.updatedAt ? new Date(event.updatedAt).toISOString().split('T')[0] : undefined,
      changefreq: 'weekly',
      priority: 0.8
    });
  });

  // Add artist pages for booking platform
  artists.forEach(artist => {
    const slug = artist.name.toLowerCase().replace(/\s+/g, '-');
    dynamicPages.push({
      url: `/booking/artists/${slug}`,
      lastmod: artist.updatedAt ? new Date(artist.updatedAt).toISOString().split('T')[0] : undefined,
      changefreq: 'monthly',
      priority: 0.7
    });
  });

  return dynamicPages;
};
