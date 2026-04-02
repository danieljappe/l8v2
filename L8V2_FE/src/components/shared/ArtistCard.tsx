import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Play, Music } from 'lucide-react';
import { Artist } from '../../services/api';
import { constructFullUrl } from '../../utils/imageUtils';

interface ArtistCardProps {
  artist: Artist;
  onClick: (artist: Artist) => void;
  variant?: 'events' | 'booking';
  index?: number;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ 
  artist, 
  onClick, 
  variant = 'events',
  index = 0 
}) => {
  // Helper function to get social media count
  const getSocialMediaCount = (artist: Artist): number => {
    if (!artist.socialMedia) return 0;
    if (Array.isArray(artist.socialMedia)) return artist.socialMedia.length;
    if (typeof artist.socialMedia === 'string') {
      try {
        const parsed = JSON.parse(artist.socialMedia);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    }
    return 0;
  };

  const isBookingVariant = variant === 'booking';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(artist)}
      className="group cursor-pointer"
    >
      <div className="relative">
        {/* Artist Image Card */}
        <div className={`relative w-full aspect-square rounded-2xl overflow-hidden border-4 border-white/10 group-hover:border-l8-blue/50 transition-all duration-300 shadow-lg group-hover:shadow-2xl bg-gradient-to-br from-gray-100 to-gray-200 ${
          isBookingVariant ? 'group-hover:border-blue-500/50' : ''
        }`}>
          {artist.imageUrl ? (
            <img
              src={constructFullUrl(artist.imageUrl)}
              alt={artist.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          
          {/* Fallback placeholder */}
          <div className={`w-full h-full flex items-center justify-center ${artist.imageUrl ? 'hidden' : ''}`}>
            <div className="text-center">
              <div className={`w-20 h-20 bg-gradient-to-br from-l8-blue to-l8-blue-light rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg ${
                isBookingVariant ? 'from-blue-400 to-cyan-500' : ''
              }`}>
                <span className="text-white text-3xl font-bold">{artist.name.charAt(0).toUpperCase()}</span>
              </div>
              <p className="text-gray-500 text-sm font-medium">No Image</p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {artist.genre && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/95 backdrop-blur-sm text-gray-800 border border-gray-200/50 shadow-sm">
                {artist.genre}
              </span>
            )}
            {isBookingVariant && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/90 backdrop-blur-sm text-white border border-green-400/50 shadow-sm">
                Tilgængelig
              </span>
            )}
          </div>
          
          {/* Social Media Count Badge (Events variant) */}
          {!isBookingVariant && artist.socialMedia && getSocialMediaCount(artist) > 0 && (
            <div className="absolute top-3 right-3">
              <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1 shadow-sm border border-gray-200/50">
                <span className="text-sm font-semibold text-gray-800">
                  {getSocialMediaCount(artist)} social
                </span>
              </div>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Play Button (Booking variant) */}
          {isBookingVariant && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-white ml-1" />
              </div>
            </div>
          )}

          {/* Artist Info Overlay (Events variant) */}
          {!isBookingVariant && (
            <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="text-center">
                <h3 className="text-white font-bold text-lg mb-1">{artist.name}</h3>
                <p className="text-l8-beige text-sm mb-2">{artist.genre}</p>
                {artist.bio && (
                  <p className="text-white/80 text-xs line-clamp-2">
                    {artist.bio}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Booking CTA (Booking variant) */}
          {isBookingVariant && (
            <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button className="w-full py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg">
                Book Nu
              </button>
            </div>
          )}

          {/* Click Indicator (Events variant) */}
          {!isBookingVariant && (
            <div className="absolute top-2 right-2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          )}
        </div>

        {/* Artist Info Below Image */}
        <div className="mt-4 text-center">
          <h3 className={`text-white font-bold text-lg mb-1 group-hover:text-l8-beige transition-colors ${
            isBookingVariant ? 'group-hover:text-blue-300' : ''
          }`}>
            {artist.name}
          </h3>
          <p className="text-white/60 text-sm mb-2">{artist.genre}</p>
          
          {/* Additional Info */}
          <div className="flex items-center justify-center space-x-4 text-xs text-white/60">
            {artist.website && (
              <div className="flex items-center space-x-1">
                <Globe className="w-3 h-3 text-blue-400" />
                <span>Website</span>
              </div>
            )}
            {artist.socialMedia && getSocialMediaCount(artist) > 0 && (
              <div className="flex items-center space-x-1">
                <span className="text-pink-400">📱</span>
                <span>{isBookingVariant ? 'Social' : `${getSocialMediaCount(artist)} platforms`}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ArtistCard;
