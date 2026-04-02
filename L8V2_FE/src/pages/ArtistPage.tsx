import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Globe, 
  Instagram, 
  Youtube, 
  Music, 
  Calendar, 
  ExternalLink,
  Video
} from 'lucide-react';
import { apiService, Artist } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmbedRenderer from '../components/EmbedRenderer';
import BookingModal from '../components/BookingModal';
import { constructFullUrl } from '../utils/imageUtils';
import { normalizeSocialMedia } from '../utils/socialMediaUtils';
import { useSEO } from '../hooks/useSEO';
import { StructuredData, createArtistSchema, createBreadcrumbSchema } from '../components/StructuredData';

const ArtistPage: React.FC = () => {
  const { artistName } = useParams<{ artistName: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    const fetchArtist = async () => {
      if (!artistName) {
        setError('Artist name not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // First, get all artists to find the one with matching name
        const response = await apiService.getArtists();
        if (response.error) {
          setError(response.error);
        } else if (response.data) {
          const foundArtist = response.data.find(a => 
            a.name.toLowerCase().replace(/\s+/g, '-') === artistName.toLowerCase()
          );
          
          if (foundArtist) {
            // Only display artists that are bookable
            if (foundArtist.isBookable) {
              setArtist(foundArtist);
            } else {
              setError('This artist is not available for booking');
            }
          } else {
            setError('Artist not found');
          }
        }
      } catch {
        setError('Failed to fetch artist');
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [artistName]);

  // SEO Configuration
  const artistSlug = artistName || '';
  const pageUrl = `/booking/artists/${artistSlug}`;
  
  // Generate SEO title (without | L8 Events as useSEO adds it)
  const seoTitle = artist 
    ? `${artist.name}${artist.genre ? ` - ${artist.genre} Artist` : ' - Artist'} | Book ${artist.name}`
    : 'Artist';

  // Generate SEO description
  const seoDescription = artist
    ? artist.bio 
      ? `${artist.bio} Book ${artist.name}${artist.genre ? ` - ${artist.genre} artist` : ''} til dit event gennem L8 Events. Professionel booking service.`
      : `Book ${artist.name}${artist.genre ? ` - ${artist.genre} artist` : ''} til dit event gennem L8 Events. Professionel booking service for danske artister.`
    : 'Book artister gennem L8 Events. Professionel booking service for events og koncerter.';

  // Generate SEO keywords
  const seoKeywords = artist
    ? [
        artist.name,
        artist.genre || '',
        'artist booking',
        'book artist',
        'L8 Events',
        'dansk musik',
        'event booking',
        'koncert booking',
        'musik booking',
        artist.isBookable ? 'bookbar artist' : '',
        'booking service',
        'dansk artist'
      ].filter(Boolean).join(', ')
    : 'artist booking, L8 Events, dansk musik, event booking';

  // Generate SEO image
  const seoImage = artist && artist.imageUrl
    ? constructFullUrl(artist.imageUrl)
    : undefined;

  // Apply SEO
  useSEO({
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    image: seoImage,
    url: pageUrl,
    type: 'profile'
  });



  const handleBookingClick = () => {
    // Show booking modal with user information
    setShowBookingModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-booking-dark via-booking-dark to-booking-teal-dark">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-booking-dark via-booking-dark to-booking-teal-dark">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Artist Not Found</h2>
          <p className="text-white/60 mb-6">{error || 'The requested artist could not be found'}</p>
          <button
            onClick={() => navigate('/booking/artists')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Artists
          </button>
        </div>
      </div>
    );
  }

  // Convert social media data to consistent array format
  const socialMediaArray = normalizeSocialMedia(artist.socialMedia);

  // Create breadcrumb navigation for Google
  const breadcrumbItems = [
    { name: 'Forside', url: '/' },
    { name: 'Booking', url: '/booking' },
    { name: 'Kunstnere', url: '/booking/artists' },
    { name: artist?.name || 'Artist', url: pageUrl }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-booking-dark via-booking-dark to-booking-teal-dark">
      {/* Structured Data for SEO */}
      {artist && (
        <>
          <StructuredData data={createArtistSchema(artist)} />
          <StructuredData data={createBreadcrumbSchema(breadcrumbItems)} />
        </>
      )}

      {/* Header */}
      <div className="relative pt-24 pb-8">
        <div className="container mx-auto px-4 pt-6">

          {/* Artist Hero Section */}
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Artist Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800/30 to-slate-900/50 backdrop-blur-sm border border-white/10 shadow-2xl">
                {artist.imageUrl ? (
                  <img
                    src={constructFullUrl(artist.imageUrl)}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                
                {/* Fallback placeholder */}
                <div className={`w-full h-full flex items-center justify-center ${artist.imageUrl ? 'hidden' : ''}`}>
                  <div className="w-32 h-32 bg-gradient-to-br from-booking-orange to-booking-teal rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-5xl font-bold">
                      {artist.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Genre Badge */}
                {artist.genre && (
                  <div className="absolute top-6 left-6">
                    <span className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-500/20 backdrop-blur-sm text-blue-300 border border-blue-500/30 shadow-lg">
                      {artist.genre}
                    </span>
                  </div>
                )}

                {/* Bookable Indicator */}
                {artist.isBookable && (
                  <div className="absolute top-6 right-6">
                    <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-green-500/20 backdrop-blur-sm border border-green-500/30 shadow-lg">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-green-300 text-sm font-semibold">Kan bookes</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Artist Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-4xl md:text-5xl font-light text-white mb-3">
                  {artist.name}
                </h1>
                {artist.bio && (
                  <p className="text-lg text-white/70 font-light leading-relaxed">
                    {artist.bio}
                  </p>
                )}
              </div>

              {/* Action Buttons and Social Media */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 pt-2">
                 <div className="flex justify-start">
                   <button
                     onClick={handleBookingClick}
                     className="px-6 py-3 bg-gradient-to-r from-booking-orange to-booking-teal text-white font-semibold rounded-full hover:from-booking-orange-dark hover:to-booking-teal-dark transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                   >
                     <Calendar className="w-4 h-4" />
                     <span>Book Denne Artist</span>
                   </button>
                 </div>

                {/* Social Media - Only show if there's social media */}
                {socialMediaArray && socialMediaArray.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-white/60 text-sm font-medium">Follow:</span>
                    <div className="flex gap-2">
                      {socialMediaArray.map((social, index) => (
                        <a
                          key={index}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300 group"
                          title={social.platform}
                        >
                          {social.platform.toLowerCase().includes('instagram') && <Instagram className="w-4 h-4 text-pink-400 group-hover:text-pink-300" />}
                          {social.platform.toLowerCase().includes('youtube') && <Youtube className="w-4 h-4 text-red-400 group-hover:text-red-300" />}
                          {social.platform.toLowerCase().includes('spotify') && <Music className="w-4 h-4 text-green-400 group-hover:text-green-300" />}
                          {social.platform.toLowerCase().includes('soundcloud') && <Music className="w-4 h-4 text-orange-400 group-hover:text-orange-300" />}
                          {social.platform.toLowerCase().includes('facebook') && <span className="text-blue-600 text-lg group-hover:text-blue-500">📘</span>}
                          {social.platform.toLowerCase().includes('tiktok') && <Video className="w-4 h-4 text-pink-400 group-hover:text-pink-300" />}
                          {!social.platform.toLowerCase().includes('instagram') && 
                           !social.platform.toLowerCase().includes('youtube') && 
                           !social.platform.toLowerCase().includes('spotify') && 
                           !social.platform.toLowerCase().includes('soundcloud') && 
                           !social.platform.toLowerCase().includes('facebook') && 
                           !social.platform.toLowerCase().includes('tiktok') && 
                           <Globe className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Spotify Embed - Show if there's a Spotify embed */}
              {artist.embeddings && Array.isArray(artist.embeddings) && artist.embeddings.find(embed => embed.platform === 'spotify') && (
                <div className="mt-6">
                  {artist.embeddings
                    .filter(embed => embed.platform === 'spotify')
                    .map((embed) => (
                      <div key={embed.id}>
                        <EmbedRenderer
                          embedCode={embed.embedCode}
                          platform={embed.platform}
                          title={embed.title}
                          className="w-full"
                        />
                      </div>
                    ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Media Section - Show if there are embeddings (excluding Spotify) */}
      {artist.embeddings && Array.isArray(artist.embeddings) && artist.embeddings.filter(embed => embed.platform !== 'spotify').length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-2xl font-light text-white mb-6 text-center">Media</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {artist.embeddings
                .filter(embed => embed.platform !== 'spotify')
                .map((embed) => (
                  <div key={embed.id} className="w-full">
                    <EmbedRenderer
                      embedCode={embed.embedCode}
                      platform={embed.platform}
                      title={embed.title}
                      className="w-full"
                    />
                  </div>
                ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Website Section - Show if there's a website */}
      {artist.website && (
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-2xl font-light text-white mb-6 text-center">Website</h2>
            <div className="flex justify-center">
              <a
                href={artist.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 px-6 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 group"
              >
                <Globe className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
                <span className="text-white text-lg group-hover:text-blue-300 transition-colors">{artist.website}</span>
                <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white/60" />
              </a>
            </div>
          </motion.div>
        </div>
      )}

      {/* Contact Section */}
      <div id="contact-section" className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 max-w-4xl mx-auto"
        >
          <h2 className="text-3xl font-light text-white mb-4">
            Book {artist.name}
          </h2>
          <p className="text-lg text-white/60 mb-6 font-light">
            Ready to book {artist.name} for your event? Get in touch with us today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleBookingClick}
              className="px-6 py-3 bg-gradient-to-r from-booking-orange to-booking-teal text-white font-semibold rounded-full hover:from-booking-orange-dark hover:to-booking-teal-dark transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Start Booking Process</span>
            </button>
             <a
               href="mailto:booking@l8events.dk"
               className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-2"
             >
               <span>Email Us</span>
             </a>
          </div>
        </motion.div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          artist={artist}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  );
};

export default ArtistPage;
