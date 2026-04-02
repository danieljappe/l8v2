// Simple routing utilities - no subdomain logic

export const getPlatformFromPath = (): 'events' | 'booking' | 'main' => {
  if (typeof window === 'undefined') return 'main';
  
  const path = window.location.pathname;
  
  if (path.startsWith('/booking')) return 'booking';
  // Events platform includes: /, /home, /events, /artists, /gallery, /about, /contact, /admin
  if (path.startsWith('/events') || path === '/' || path === '/home' || 
      path === '/artists' || path === '/gallery' || path === '/about' || 
      path === '/contact' || path === '/admin') return 'events';
  return 'main';
};

export const shouldShowPlatformChoice = (): boolean => {
  // Only show platform choice on the root path
  return window.location.pathname === '/';
};
