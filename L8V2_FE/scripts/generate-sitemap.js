import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API Base URL - adjust this based on your backend deployment
const API_BASE_URL = process.env.VITE_API_URL || 'https://l8events.dk/api';

// Slugify function to convert event titles to URL-friendly slugs
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Wait for API to be available (useful during deployment)
const waitForAPI = async (maxWaitTime = 30000, checkInterval = 2000) => {
  const startTime = Date.now();
  const healthCheckEndpoint = '/events'; // Simple endpoint to check if API is up
  
  console.log(`Waiting for API to be available at ${API_BASE_URL}...`);
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}${healthCheckEndpoint}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status === 200) {
        console.log('✅ API is available');
        return true;
      }
    } catch (error) {
      // API not ready yet, continue waiting
    }
    
    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, checkInterval));
    process.stdout.write('.'); // Show progress
  }
  
  console.log('\n⚠️  API not available after waiting, proceeding with static pages only');
  return false;
};

// Helper function to fetch data from API with retry logic
const fetchFromAPI = async (endpoint, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Don't retry on client errors (4xx), only on server errors (5xx)
        if (response.status >= 400 && response.status < 500) {
          console.warn(`Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`);
          return [];
        }
        
        // Retry on server errors
        if (attempt < retries) {
          const delay = (attempt + 1) * 1000; // Exponential backoff: 1s, 2s
          console.warn(`Failed to fetch ${endpoint}: ${response.status} ${response.statusText}. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        console.warn(`Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const jsonData = await response.json();
      
      // Handle API response format: { data: [...] } or just [...]
      // Backend returns arrays directly, but frontend API client wraps them
      let data = jsonData;
      if (jsonData && typeof jsonData === 'object' && !Array.isArray(jsonData) && 'data' in jsonData) {
        data = jsonData.data;
      }
      
      // Ensure we return an array
      if (!Array.isArray(data)) {
        console.warn(`Unexpected data format from ${endpoint}, expected array. Got:`, typeof data);
        return [];
      }
      
      return data || [];
    } catch (error) {
      if (error.name === 'AbortError') {
        if (attempt < retries) {
          console.warn(`Timeout fetching ${endpoint}. Retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        console.warn(`Timeout fetching ${endpoint} (10s limit)`);
      } else if (attempt < retries) {
        const delay = (attempt + 1) * 1000;
        console.warn(`Error fetching ${endpoint}: ${error.message}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      } else {
        console.warn(`Error fetching ${endpoint}:`, error.message);
      }
      return [];
    }
  }
  return [];
};

// Generate sitemap with both static and dynamic content
const generateSitemap = async () => {
  const baseUrl = 'https://l8events.dk';
  
  // Static pages
  const staticPages = [
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
      changefreq: 'monthly',
      priority: 0.8
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
      priority: 0.6
    },
    {
      url: '/contact',
      changefreq: 'monthly',
      priority: 0.6
    }
  ];

  // Fetch dynamic content from API
  const skipApiCalls = process.env.SKIP_SITEMAP_API === 'true';
  const waitForApi = process.env.WAIT_FOR_API !== 'false'; // Default to true
  
  let events = [];
  let artists = [];
  
  if (skipApiCalls) {
    console.log('⚠️  Skipping API calls (SKIP_SITEMAP_API=true). Generating sitemap with static pages only.');
  } else {
    console.log('Fetching dynamic content from API...');
    console.log(`API Base URL: ${API_BASE_URL}`);
    
    // Wait for API to be available if enabled (useful during deployment)
    if (waitForApi) {
      const apiReady = await waitForAPI(30000); // Wait up to 30 seconds
      if (!apiReady) {
        console.warn('⚠️  API not ready, generating sitemap with static pages only.');
      }
    }
    
    [events, artists] = await Promise.all([
      fetchFromAPI('/events'),
      fetchFromAPI('/artists')
    ]);

    const bookableCount = artists.filter(a => a.isBookable === true).length;
    console.log(`Found ${events.length} events and ${artists.length} artists (${bookableCount} bookable)`);
    
    if (events.length === 0 && artists.length === 0) {
      console.warn('⚠️  Warning: No dynamic content fetched from API. Sitemap will only include static pages.');
      console.warn('   Possible reasons:');
      console.warn('   - API is unavailable during build time (common in CI/CD)');
      console.warn('   - API requires authentication or is behind a firewall');
      console.warn('   - Network connectivity issues');
      console.warn('   To skip API calls entirely, set SKIP_SITEMAP_API=true');
      console.warn('   The sitemap will still be generated with static pages.');
    }
  }

  // Add dynamic event pages
  const eventPages = events.map(event => ({
    url: `/events/${slugify(event.title)}`,
    lastmod: event.updatedAt ? new Date(event.updatedAt).toISOString().split('T')[0] : undefined,
    changefreq: 'weekly',
    priority: 0.8
  }));

  // Add dynamic artist pages (for booking platform) - only include bookable artists
  const bookableArtists = artists.filter(artist => artist.isBookable === true);
  const artistPages = bookableArtists.map(artist => {
    const slug = artist.name.toLowerCase().replace(/\s+/g, '-');
    return {
      url: `/booking/artists/${slug}`,
      lastmod: artist.updatedAt ? new Date(artist.updatedAt).toISOString().split('T')[0] : undefined,
      changefreq: 'monthly',
      priority: 0.7
    };
  });

  // Combine all pages
  const allPages = [...staticPages, ...eventPages, ...artistPages];

  // Generate XML
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  allPages.forEach(page => {
    const fullUrl = page.url.startsWith('http') ? page.url : `${baseUrl}${page.url}`;
    const lastmod = page.lastmod || new Date().toISOString().split('T')[0];
    const changefreq = page.changefreq || 'weekly';
    const priority = page.priority || 0.5;

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

  return {
    sitemap,
    staticCount: staticPages.length,
    dynamicCount: eventPages.length + artistPages.length,
    totalCount: allPages.length
  };
};

// Generate and write sitemap
const main = async () => {
  try {
    console.log('Generating sitemap...');
    const { sitemap, staticCount, dynamicCount, totalCount } = await generateSitemap();
    
    const publicPath = path.join(__dirname, '../public');
    const sitemapPath = path.join(publicPath, 'sitemap.xml');
    
    // Ensure public directory exists
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true });
    }
    
    fs.writeFileSync(sitemapPath, sitemap);
    
    console.log('✅ Sitemap generated successfully at:', sitemapPath);
    console.log(`   Total URLs: ${totalCount} (${staticCount} static, ${dynamicCount} dynamic)`);
    
    if (dynamicCount === 0) {
      console.log('   ⚠️  Note: No dynamic URLs included. If this is unexpected, check API connectivity.');
      console.log('   The sitemap will still work with static pages only.');
    }
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
};

main();
