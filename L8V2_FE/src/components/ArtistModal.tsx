import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Globe, Music, Calendar, ExternalLink } from 'lucide-react';
import { constructFullUrl } from '../utils/imageUtils';
import { Artist } from '../services/api';
import EmbeddingManager from './EmbeddingManager';
import EmbedRenderer from './EmbedRenderer';
import { normalizeSocialMedia } from '../utils/socialMediaUtils';

interface ArtistModalProps {
  artist: Artist | null;
  onClose: () => void;
  isAdmin?: boolean;
}

const ArtistModal: React.FC<ArtistModalProps> = ({ artist, onClose, isAdmin = false }) => {
  const [embeddings, setEmbeddings] = useState(artist?.embeddings || []);

  // Update embeddings when artist changes
  useEffect(() => {
    if (artist?.embeddings) {
      setEmbeddings(artist.embeddings);
    } else {
      setEmbeddings([]);
    }
  }, [artist?.embeddings]);

  if (!artist) return null;

  // Helper function to convert artist name to URL-friendly format
  const getArtistUrl = (artistName: string) => {
    return artistName.toLowerCase().replace(/\s+/g, '-');
  };

  // Convert social media data to consistent array format
  const socialMediaArray = normalizeSocialMedia(artist.socialMedia);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-white/10 shadow-2xl"
        >
          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-3 bg-black/70 backdrop-blur-sm rounded-full border border-white/20 text-white hover:text-white hover:bg-black/80 transition-all duration-200 shadow-lg"
          >
            <X className="w-5 h-5" />
          </motion.button>

          {/* Artist Image */}
          <div className="relative h-48 sm:h-64 md:h-80">
            <img
              src={constructFullUrl(artist.imageUrl)}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
            
            {/* Artist Name Overlay on Image */}
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                {artist.name}
              </h1>
              
              {/* Social Media Logos - Under Name */}
              {socialMediaArray && socialMediaArray.length > 0 && (
                <div className="flex gap-2">
                  {socialMediaArray.map((media, index) => (
                    <motion.a
                      key={index}
                      href={media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 text-white/80 hover:text-white hover:bg-white/30 transition-all duration-200 flex items-center justify-center"
                      title={media.platform}
                    >
                      {media.platform.toLowerCase().includes('instagram') && <img src="/icons/Instagram_icon.png" alt="Instagram" className="w-5 h-5" />}
                      {media.platform.toLowerCase().includes('youtube') && <img src="/icons/Youtube_icon.png" alt="YouTube" className="w-5 h-5" />}
                      {media.platform.toLowerCase().includes('spotify') && <img src="/icons/Spotify_icon.svg.png" alt="Spotify" className="w-5 h-5" />}
                      {media.platform.toLowerCase().includes('soundcloud') && <img src="/icons/soundcloud_icon.png" alt="SoundCloud" className="w-5 h-5" />}
                      {media.platform.toLowerCase().includes('x') && <img src="/icons/x_icon.png" alt="X" className="w-5 h-5" />}
                      {media.platform.toLowerCase().includes('facebook') && <span className="text-blue-600 text-2xl font-bold">📘</span>}
                      {media.platform.toLowerCase().includes('tiktok') && <span className="text-pink-400 text-2xl font-bold">🎵</span>}
                      {media.platform.toLowerCase().includes('linkedin') && <span className="text-blue-700 text-2xl font-bold">💼</span>}
                      {media.platform.toLowerCase().includes('twitch') && <span className="text-l8-blue text-2xl font-bold">🎮</span>}
                      {media.platform.toLowerCase().includes('discord') && <span className="text-l8-beige text-2xl font-bold">💬</span>}
                      {!media.platform.toLowerCase().includes('instagram') && 
                       !media.platform.toLowerCase().includes('youtube') && 
                       !media.platform.toLowerCase().includes('spotify') && 
                       !media.platform.toLowerCase().includes('soundcloud') && 
                       !media.platform.toLowerCase().includes('twitter') && 
                       !media.platform.toLowerCase().includes('facebook') && 
                       !media.platform.toLowerCase().includes('tiktok') && 
                       !media.platform.toLowerCase().includes('linkedin') && 
                       !media.platform.toLowerCase().includes('twitch') && 
                       !media.platform.toLowerCase().includes('discord') && 
                       <Globe className="w-5 h-5" />}
                    </motion.a>
                  ))}
                </div>
              )}
            </div>
            
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-320px)]">
            <div className="p-6 sm:p-8">
              <div className="mb-8">
                {artist.bio && (
                  <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-4">
                    {artist.bio}
                  </p>
                )}
                
                {/* Website Link, Genre, and Bookable Status */}
                <div className="flex flex-wrap items-center gap-6 mb-4">
                  {artist.website && (
                    <a
                      href={artist.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Globe className="w-5 h-5" />
                      <span className="underline">{artist.website}</span>
                    </a>
                  )}
                  
                  {artist.website && (artist.genre || artist.isBookable) && (
                    <div className="w-px h-6 bg-white/20"></div>
                  )}
                  
                  {artist.genre && (
                    <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/80 border border-white/20">
                      {artist.genre}
                    </span>
                  )}
                  
                  {artist.genre && artist.isBookable && (
                    <div className="w-px h-6 bg-white/20"></div>
                  )}
                  
                  {artist.isBookable && (
                    <span className="inline-flex items-center space-x-2 px-3 py-1.5 bg-green-500/20 backdrop-blur-sm rounded-full text-sm text-green-400 border border-green-500/30">
                      <Calendar className="w-4 h-4" />
                      <span>Available for booking</span>
                    </span>
                  )}
                </div>

                {/* View Full Profile Button - Only show for bookable artists */}
                {artist.isBookable && (
                  <div className="mt-6">
                    <Link
                      to={`/booking/artists/${getArtistUrl(artist.name)}`}
                      onClick={onClose}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <span>View Full Profile</span>
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Embeddings Section */}
              <div className="mt-8 pt-6 border-t border-white/10">
               
                {embeddings && embeddings.length > 0 ? (
                  <div className="space-y-4">
                    {embeddings.map((embedding) => (
                      <EmbedRenderer
                        key={embedding.id}
                        embedCode={embedding.embedCode}
                        platform={embedding.platform}
                        title={embedding.title}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/60">
                    <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No music or media available yet</p>
                    {!isAdmin && (
                      <p className="text-sm mt-1">Check back later for music and videos</p>
                    )}
                  </div>
                )}

                {/* Embedding Manager for Admins */}
                {isAdmin && (
                  <div className="mt-6">
                    <EmbeddingManager
                      artistId={artist.id}
                      embeddings={embeddings}
                      onEmbeddingsChange={setEmbeddings}
                      isAdmin={isAdmin}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ArtistModal; 