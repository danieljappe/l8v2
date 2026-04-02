import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useEvent, useArtists } from '../hooks/useApi';

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Check if we're on an event details page
  const isEventDetailsPage = pathnames.length === 2 && pathnames[0] === 'events' && pathnames[1];
  const eventName = isEventDetailsPage ? pathnames[1] : null;
  
  // Fetch event data if we're on an event details page (using event name/slug)
  const { data: event, loading: eventLoading } = useEvent(eventName || '');

  // Check if we're on an artist page
  const isArtistPage = pathnames.length === 3 && pathnames[0] === 'booking' && pathnames[1] === 'artists' && pathnames[2];
  
  // Safely decode the artist slug
  let artistSlug: string | null = null;
  if (isArtistPage && pathnames[2]) {
    try {
      artistSlug = decodeURIComponent(pathnames[2]);
    } catch (e) {
      // If decoding fails, use the raw value
      artistSlug = pathnames[2];
    }
  }
  
  // Fetch all artists to find the matching one
  const { data: artists, loading: artistsLoading } = useArtists();
  
  // Find the artist by matching the slug
  const artist = React.useMemo(() => {
    if (!isArtistPage || !artists || !artistSlug) return null;
    
    // Helper function to convert artist name to URL-friendly format (same as getArtistUrl)
    const getArtistUrl = (artistName: string) => {
      return artistName.toLowerCase().replace(/\s+/g, '-');
    };
    
    return artists.find(a => getArtistUrl(a.name) === artistSlug!.toLowerCase()) || null;
  }, [isArtistPage, artists, artistSlug]);

  const breadcrumbNameMap: { [key: string]: string } = {
    home: 'Home',
    events: 'Begivenheder',
    artists: 'Kunstnere',
    gallery: 'Galleri',
    about: 'Om Os',
    contact: 'Kontakt',
    admin: 'Admin',
    booking: 'Booking',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center space-x-2 text-sm"
    >
      <Link to="/home">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center text-white/60 hover:text-white transition-colors"
        >
          <Home className="w-4 h-4" />
        </motion.div>
      </Link>

      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        
        // Use event name if we're on an event details page and this is the event ID
        let displayName = breadcrumbNameMap[value] || value;
        if (isEventDetailsPage && last) {
          if (event?.title) {
            displayName = event.title;
          } else if (eventLoading) {
            displayName = 'Loading...';
          }
          // If event fails to load, fall back to showing the ID
        }
        
        // Use artist name if we're on an artist page and this is the artist slug
        if (isArtistPage && last && index === 2) {
          if (artist?.name) {
            displayName = artist.name;
          } else if (artistsLoading) {
            displayName = 'Loading...';
          } else {
            // If artist fails to load, try to decode and format the slug as fallback
            try {
              displayName = decodeURIComponent(value).replace(/-/g, ' ');
            } catch (e) {
              // If decoding fails, just use the value with hyphens replaced
              displayName = value.replace(/-/g, ' ');
            }
          }
        }

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-4 h-4 text-white/40" />
            {last ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white font-medium"
              >
                {displayName}
              </motion.span>
            ) : (
              <Link to={to}>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  {displayName}
                </motion.span>
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </motion.div>
  );
};

export default Breadcrumbs; 