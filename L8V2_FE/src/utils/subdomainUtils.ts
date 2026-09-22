// Simple routing utilities - no subdomain logic

import { BOOKING_ENABLED } from '../config/features';

export const getPlatformFromPath = (): 'events' | 'booking' | 'main' => {
  if (typeof window === 'undefined') return 'main';

  const path = window.location.pathname;

  if (BOOKING_ENABLED && path.startsWith('/booking')) return 'booking';
  // Events platform includes: /, /home, /events, /artists, /gallery, /about, /contact, /admin
  if (path.startsWith('/events') || path === '/' || path === '/home' || 
      path === '/artists' || path === '/gallery' || path === '/about' || 
      path === '/contact' || path === '/admin') return 'events';
  return 'main';
};

export const shouldShowPlatformChoice = (): boolean => {
  // With Booking disabled there is only one platform, so there is nothing to
  // choose and the root goes straight to Events.
  if (!BOOKING_ENABLED) return false;

  // Only show platform choice on the root path
  return window.location.pathname === '/';
};
