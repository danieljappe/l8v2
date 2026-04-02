import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Music, Ticket, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import { useEvents } from '../hooks/useApi';
import { Event } from '../services/api';
import { constructFullUrl } from '../utils/imageUtils';
import { slugify } from '../utils/slugUtils';

interface ProcessedEvent extends Event {
  status: 'upcoming' | 'past';
  color: string;
  artists: string[];
}

const EventList: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<ProcessedEvent | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  // Fetch events from API
  const { data: events, loading, error } = useEvents();

  // Monitor network status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  // Process events data
  const processedEvents: ProcessedEvent[] = events?.map(event => ({
    ...event,
    status: new Date(event.date) >= new Date() ? 'upcoming' : 'past',
    color: getEventColor(event.id),
    artists: event.eventArtists?.map(ea => ea.artist.name) || []
  })) || [];

  function getEventColor(eventId: string): string {
    const colors = ['l8-blue', 'l8-beige', 'l8-blue-light', 'l8-beige-dark', 'l8-blue-dark', 'l8-beige-light'];
    // Simple hash function to convert string to number
    let hash = 0;
    for (let i = 0; i < eventId.length; i++) {
      const char = eventId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return colors[Math.abs(hash) % colors.length];
  }

  // Sort events by date (latest first)
  const sortedEvents = [...processedEvents].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Removed unused animation variants for better mobile compatibility

  // Show loading state
  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center p-4 snap-start pt-20 lg:pt-16">
        <LoadingSpinner size="lg" text="Loading events..." />
      </section>
    );
  }

  // Show offline state
  if (!isOnline) {
    return (
      <section className="min-h-screen flex items-center justify-center p-4 snap-start pt-20 lg:pt-16">
        <div className="text-center max-w-md mx-auto">
          <p className="text-yellow-400 mb-4 text-lg">You're offline</p>
          <p className="text-white/60 mb-6 text-sm">
            Please check your internet connection and try again.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-l8-blue hover:bg-l8-blue-dark text-white px-6 py-3 rounded-lg font-semibold w-full sm:w-auto"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  // Show error state
  if (error) {
    return (
      <section className="min-h-screen flex items-center justify-center p-4 snap-start pt-20 lg:pt-16">
        <div className="text-center max-w-md mx-auto">
          <p className="text-red-400 mb-4 text-lg">Failed to load events</p>
          <p className="text-white/60 mb-6 text-sm">
            Error: {error}
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="bg-l8-blue hover:bg-l8-blue-dark text-white px-6 py-3 rounded-lg font-semibold w-full sm:w-auto"
            >
              Retry
            </button>
            <button 
              onClick={() => {
                // Clear any cached data and retry
                localStorage.clear();
                window.location.reload();
              }}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold w-full sm:w-auto ml-0 sm:ml-3"
            >
              Clear Cache & Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Show empty state
  if (!events || events.length === 0) {
    return (
      <section className="min-h-screen flex items-center justify-center p-4 snap-start pt-20 lg:pt-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">No Events Found</h2>
          <p className="text-white/70">Check back soon for upcoming events!</p>
        </div>
      </section>
    );
  }

  if (selectedEvent) {
    return (
      <section className="min-h-screen flex items-center justify-center p-4 snap-start pt-20 lg:pt-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto max-w-4xl"
        >
          <motion.div 
            className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 sm:p-8 shadow-2xl"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedEvent(null)}
              className="flex items-center text-white/80 hover:text-white mb-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Tilbage til begivenheder
            </motion.button>

            <motion.h2 
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
            >
              {selectedEvent.title}
            </motion.h2>

            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
            >
              <div className="flex items-center space-x-3 text-white/80 bg-white/5 p-3 rounded-2xl">
                <Calendar className="w-5 h-5 text-l8-beige" />
                <div>
                  <p className="text-sm text-white/60">Dato</p>
                  <p className="font-semibold">
                    {new Date(selectedEvent.date).toLocaleDateString('da-DK', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-white/80 bg-white/5 p-3 rounded-2xl">
                <Clock className="w-5 h-5 text-l8-beige" />
                <div>
                  <p className="text-sm text-white/60">Tidspunkt</p>
                  <p className="font-semibold">{selectedEvent.startTime || '21:00'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-white/80 bg-white/5 p-3 rounded-2xl">
                <MapPin className="w-5 h-5 text-l8-beige" />
                <div>
                  <p className="text-sm text-white/60">Sted</p>
                  <p className="font-semibold">{selectedEvent.venue?.name || 'TBA'}</p>
                </div>
              </div>
            </motion.div>

            <motion.div className="mb-6">
              <motion.h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                <Music className="w-5 h-5 mr-2 text-l8-beige" />
                Kunstnere
              </motion.h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedEvent.eventArtists?.map((eventArtist) => (
                  <motion.div
                    key={eventArtist.id}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-l8-blue to-l8-blue-light rounded-full mb-2 mx-auto overflow-hidden">
                      <img 
                        src={eventArtist.artist.imageUrl ? constructFullUrl(eventArtist.artist.imageUrl) : 'https://via.placeholder.com/300x300/1a1a2e/ffffff?text=Artist'} 
                        alt={eventArtist.artist.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to stock photo if artist image fails to load
                          const target = e.target as HTMLImageElement;
                          if (target.src !== 'https://via.placeholder.com/300x300/1a1a2e/ffffff?text=Artist') {
                            target.src = 'https://via.placeholder.com/300x300/1a1a2e/ffffff?text=Artist';
                          }
                        }}
                      />
                    </div>
                    <p className="text-white font-medium text-center text-sm">{eventArtist.artist.name}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div className="mb-6">
              <motion.h3 className="text-xl font-semibold text-white mb-3">
                Om Begivenheden
              </motion.h3>
              <motion.p className="text-white/80 leading-relaxed">
                {selectedEvent.description}
              </motion.p>
            </motion.div>

            {selectedEvent.status === 'upcoming' && (
              <motion.div className="text-center">
                <motion.button 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/events/${slugify(selectedEvent.title)}`)}
                  className="bg-gradient-to-r from-l8-blue to-l8-blue-light hover:from-l8-blue-dark hover:to-l8-blue text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 mx-auto"
                >
                  <Ticket className="w-5 h-5" />
                  <span>Se Detaljer & Køb Billetter</span>
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="min-h-screen flex items-center justify-center p-4 snap-start pt-20 xl:pt-16">
      <div className="container mx-auto max-w-6xl w-full opacity-100">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Events
          </h1>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto px-4">
            Udforsk vores kommende og tidligere afholdte events. Dont be L8.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 w-full">
          {sortedEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => navigate(`/events/${slugify(event.title)}`)}
              className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 sm:p-8 shadow-2xl cursor-pointer transition-all duration-300 group hover:scale-105 active:scale-95"
            >
              {/* Event Status Badge */}
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                  event.status === 'upcoming' 
                    ? 'bg-green-500/20 text-green-200 border border-green-300/30' 
                    : 'bg-gray-500/20 text-gray-200 border border-gray-300/30'
                }`}
              >
                {event.status === 'upcoming' ? 'Kommende' : 'Afsluttet'}
              </div>

              {/* Event Title */}
              <h3 
                className="text-xl sm:text-2xl font-bold text-white mb-4 group-hover:text-l8-beige transition-colors duration-300"
              >
                {event.title}
              </h3>

              {/* Event Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3 text-white/80">
                  <Calendar className="w-4 h-4 text-l8-beige flex-shrink-0" />
                  <span className="text-sm">
                    {new Date(event.date).toLocaleDateString('da-DK', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-white/80">
                  <Clock className="w-4 h-4 text-l8-beige flex-shrink-0" />
                  <span className="text-sm">{event.startTime || '21:00'}</span>
                </div>
                <div className="flex items-center space-x-3 text-white/80">
                  <MapPin className="w-4 h-4 text-l8-beige flex-shrink-0" />
                  <span className="text-sm truncate">{event.venue?.name || 'TBA'}</span>
                </div>
              </div>

              {/* Artists Preview */}
              {event.eventArtists && event.eventArtists.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center">
                    <Music className="w-4 h-4 mr-2 text-l8-beige" />
                    Kunstnere
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {event.eventArtists.slice(0, 3).map((eventArtist) => (
                      <span 
                        key={eventArtist.id}
                        className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/70"
                      >
                        {eventArtist.artist.name}
                      </span>
                    ))}
                    {event.eventArtists.length > 3 && (
                      <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/70">
                        +{event.eventArtists.length - 3} mere
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Event Description */}
              <p className="text-white/70 text-sm leading-relaxed mb-6 line-clamp-3">
                {event.description}
              </p>

              {/* CTA Button - now just for style, not navigation */}
              <div className="text-center">
                <button
                  className="bg-gradient-to-r from-l8-blue to-l8-blue-light hover:from-l8-blue-dark hover:to-l8-blue text-white font-semibold px-4 py-2 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 w-full text-sm pointer-events-none"
                  tabIndex={-1}
                >
                  <Ticket className="w-4 h-4" />
                  <span>{event.status === 'upcoming' ? 'Se Detaljer' : 'Se Opsummering'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventList; 