import React from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Music, Ticket, Users, AlertCircle, Camera } from 'lucide-react';
import Header from '../components/Header';
import ArtistModal from '../components/ArtistModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useEvent } from '../hooks/useApi';
import { Artist } from '../services/api';
import { constructFullUrl } from '../utils/imageUtils';
import VenueMapEmbed from '../components/VenueMapEmbed';

const EventDetails: React.FC = () => {
  const { eventName } = useParams();
  const navigate = useNavigate();
  const [selectedArtist, setSelectedArtist] = React.useState<Artist | null>(null);

  // Validate eventName before making API call
  const isValidEventName = eventName && typeof eventName === 'string' && eventName.trim() !== '';

  // Fetch event data from API only if eventName is valid
  const { data: event, loading, error } = useEvent(isValidEventName ? eventName : '');

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen overflow-x-hidden">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <LoadingSpinner size="lg" text="Loading event details..." />
        </div>
      </div>
    );
  }

  // Show error state for invalid event name
  if (!isValidEventName) {
    return (
      <div className="min-h-screen overflow-x-hidden">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Invalid Event Name</h2>
            <p className="text-white/70 mb-4">The event name in the URL is not valid.</p>
            <button 
              onClick={() => navigate('/events')}
              className="bg-l8-blue hover:bg-l8-blue-dark text-white px-6 py-3 rounded-lg transition-colors"
            >
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !event) {
    return (
      <div className="min-h-screen overflow-x-hidden">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Event Not Found</h2>
            <p className="text-white/70 mb-4">The event you're looking for doesn't exist or has been removed.</p>
            <button 
              onClick={() => navigate('/events')}
              className="bg-l8-blue hover:bg-l8-blue-dark text-white px-6 py-3 rounded-lg transition-colors"
            >
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if event is upcoming or past
  const isUpcoming = new Date(event.date) >= new Date();

  // Billetto link for ticket purchase
  const billettoLink = event.billettoURL || 'https://billetto.dk';

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[500px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={event.imageUrl ? constructFullUrl(event.imageUrl) : (event.venue?.imageUrl ? constructFullUrl(event.venue.imageUrl) : 'https://via.placeholder.com/1920x1080/1a1a2e/ffffff?text=Event+Image')} 
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to venue image or stock photo if event image fails to load
              const target = e.target as HTMLImageElement;
              if (event.venue?.imageUrl && target.src !== constructFullUrl(event.venue.imageUrl)) {
                target.src = constructFullUrl(event.venue.imageUrl);
              } else if (target.src !== 'https://via.placeholder.com/1920x1080/1a1a2e/ffffff?text=Event+Image') {
                target.src = 'https://via.placeholder.com/1920x1080/1a1a2e/ffffff?text=Event+Image';
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-l8-dark/90"></div>
        </div>
        
        {/* Event Title and Info */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            {event.title}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 text-white/80 bg-white/10 backdrop-blur-sm p-3 rounded-xl">
              <Calendar className="w-5 h-5 text-l8-beige" />
              <div>
                <p className="text-sm text-white/60">Dato</p>
                <p className="font-semibold">
                  {new Date(event.date).toLocaleDateString('da-DK', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-white/80 bg-white/10 backdrop-blur-sm p-3 rounded-xl">
              <Clock className="w-5 h-5 text-l8-beige" />
              <div>
                <p className="text-sm text-white/60">Tidspunkt</p>
                <p className="font-semibold">{event.startTime || '21:00'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-white/80 bg-white/10 backdrop-blur-sm p-3 rounded-xl">
              <MapPin className="w-5 h-5 text-l8-beige" />
              <div>
                <p className="text-sm text-white/60">Sted</p>
                <p className="font-semibold">{event.venue?.name || 'TBA'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 bg-gradient-to-b from-l8-dark/80 via-black/50 to-l8-dark/80 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Description */}
            <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 p-6 sm:p-8 mb-8">
              <p className="text-white leading-relaxed text-lg">
                {event.description}
              </p>
            </div>

            {/* Gallery Images Section */}
            {event.galleryImages && event.galleryImages.length > 0 && (
              <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 p-6 sm:p-8 mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center">
                  <Camera className="w-6 h-6 mr-2 text-l8-beige" />
                  Galleri
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {event.galleryImages
                    .filter(img => img.isPublished)
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((image) => (
                    <motion.div
                      key={image.id}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="group relative bg-black/20 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 cursor-pointer"
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <img 
                          src={image.largeUrl ? constructFullUrl(image.largeUrl) : 
                               image.mediumUrl ? constructFullUrl(image.mediumUrl) : 
                               image.url ? constructFullUrl(image.url) : 
                               'https://via.placeholder.com/400x400/1a1a2e/ffffff?text=Image'} 
                          alt={image.caption || 'Event gallery image'}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== 'https://via.placeholder.com/400x400/1a1a2e/ffffff?text=Image') {
                              target.src = 'https://via.placeholder.com/400x400/1a1a2e/ffffff?text=Image';
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      
                      {(image.caption || image.photographer) && (
                        <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          {image.caption && (
                            <p className="text-white text-sm font-medium mb-1 line-clamp-2">
                              {image.caption}
                            </p>
                          )}
                          {image.photographer && (
                            <p className="text-white/70 text-xs">
                              Foto: {image.photographer}
                            </p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Artists Section */}
            {event.eventArtists && event.eventArtists.length > 0 && (
              <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 p-6 sm:p-8 mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center">
                  <Music className="w-6 h-6 mr-2 text-l8-beige" />
                  Kunstnere
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {event.eventArtists.map((eventArtist) => (
                    <motion.div
                      key={eventArtist.id}
                      whileHover={{ 
                        scale: 1.02, 
                        y: -5,
                        transition: { duration: 0.2 }
                      }}
                      onClick={() => setSelectedArtist(eventArtist.artist)}
                      className="group relative bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/20 cursor-pointer overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-l8-blue/20 to-l8-blue-light/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-start space-x-4">
                        <motion.div 
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="w-16 h-16 rounded-xl bg-gradient-to-br from-l8-blue to-l8-blue-light flex-shrink-0 overflow-hidden"
                        >
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
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-l8-beige transition-colors duration-300">
                            {eventArtist.artist.name}
                          </h3>
                          <p className="text-l8-beige text-sm mb-2">{eventArtist.artist.genre}</p>
                          <p className="text-white/90 text-sm line-clamp-2">{eventArtist.artist.bio}</p>
                          <div className="mt-3 text-l8-beige text-sm font-medium">
                            Klik for at læse mere →
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Venue Information */}
            {event.venue && (
              <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 p-6 sm:p-8 mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center">
                  <MapPin className="w-6 h-6 mr-2 text-l8-beige" />
                  Lokation
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                  <div className="space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-2xl font-semibold text-white">{event.venue.name}</h3>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                        <MapPin className="w-4 h-4 text-l8-beige" />
                        <span>{event.venue.address}</span>
                      </div>
                      {event.venue.city && (
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                          <span className="w-2 h-2 rounded-full bg-l8-beige inline-block" />
                          <span>{event.venue.city}</span>
                        </div>
                      )}
                    </div>
                    {event.venue.description && (
                      <p className="text-white/80 text-sm leading-relaxed">
                        {event.venue.description}
                      </p>
                    )}
                  </div>
                </div>
                {event.venue.mapEmbedHtml && (
                  <div className="mt-6">
                    <div className="bg-black/20 rounded-2xl p-3 border border-white/10">
                      <VenueMapEmbed
                        embedHtml={event.venue.mapEmbedHtml}
                        title={`Kort over ${event.venue.name}`}
                        height={360}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tickets Section - Only show for upcoming events */}
            {isUpcoming && (
              <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center">
                  <Ticket className="w-6 h-6 mr-2 text-l8-beige" />
                  Billetter
                </h2>

                <div className="max-w-md mx-auto">
                  <motion.div
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center"
                  >
                    <div className="mb-6">
                      <h3 className="text-2xl font-semibold text-white mb-2">Event Billet</h3>
                    </div>
                    
                    <motion.a
                      href={billettoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-block w-full bg-gradient-to-r from-l8-blue to-l8-blue-light hover:from-l8-blue-dark hover:to-l8-blue text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Køb Billet på Billetto
                    </motion.a>
                    
                    <p className="text-white/60 text-sm mt-4">
                      Du vil blive omdirigeret til Billetto for at gennemføre købet
                    </p>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Past Event Message */}
            {!isUpcoming && (
              <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 p-6 sm:p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Event Afsluttet</h2>
                <p className="text-white/70 mb-6">
                  Dette event har allerede fundet sted. Tak til alle, der deltog og gjorde det til en fantastisk aften!
                </p>
                <button
                  onClick={() => navigate('/events')}
                  className="bg-l8-blue hover:bg-l8-blue-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  Se Andre Events
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Artist Modal */}
      <ArtistModal 
        artist={selectedArtist} 
        onClose={() => setSelectedArtist(null)} 
        isAdmin={false}
      />
    </div>
  );
};

export default EventDetails; 