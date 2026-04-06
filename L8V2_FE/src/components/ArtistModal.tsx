import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Globe, Music, Calendar, ExternalLink } from 'lucide-react';
import { constructFullUrl } from '../utils/imageUtils';
import type { Artist } from '../services/api';
import EmbeddingManager from './EmbeddingManager';
import EmbedRenderer from './EmbedRenderer';
import { normalizeSocialMedia } from '../utils/socialMediaUtils';

interface ArtistModalProps {
  artist: Artist | null;
  onClose: () => void;
  isAdmin?: boolean;
}

const ArtistModal: React.FC<ArtistModalProps> = ({ artist, onClose, isAdmin = false }) => {
  const [embeddings, setEmbeddings] = useState(artist?.embeddings ?? []);
  const [imageCollapsed, setImageCollapsed] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (artist?.embeddings) {
      setEmbeddings(artist.embeddings);
    } else {
      setEmbeddings([]);
    }
  }, [artist?.embeddings]);

  // Reset scroll state when artist changes
  useEffect(() => {
    setImageCollapsed(false);
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [artist?.id]);

  const handleScroll = () => {
    if (contentRef.current) {
      setImageCollapsed(contentRef.current.scrollTop > 60);
    }
  };

  if (!artist) return null;

  const getArtistUrl = (artistName: string) => {
    return artistName.toLowerCase().replace(/\s+/g, '-');
  };

  const socialMediaArray = normalizeSocialMedia(artist.socialMedia);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-start justify-center p-0 sm:px-4 sm:pb-4 sm:pt-32"
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-2xl sm:max-w-3xl flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[calc(100dvh-7.5rem)] sm:max-h-[calc(100dvh-9rem)]"
        >
          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 bg-black/60 backdrop-blur-sm rounded-full border border-white/20 text-white hover:bg-black/80 transition-all duration-200 shadow-lg"
          >
            <X className="w-4 h-4" />
          </motion.button>

          {/* Artist Image — collapses on scroll */}
          <div
            onClick={() => setImageExpanded(true)}
            className={`relative shrink-0 overflow-hidden transition-all duration-300 ease-in-out cursor-zoom-in ${
              imageCollapsed ? 'h-16 sm:h-14' : 'h-72 sm:h-56 md:h-64'
            }`}
          >
            <img
              src={constructFullUrl(artist.imageUrl)}
              alt={artist.name}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent pointer-events-none" />

            {/* Full image overlay — visible when expanded */}
            <motion.div
              animate={{ opacity: imageCollapsed ? 0 : 1 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-4 left-5 right-14 pointer-events-none"
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 drop-shadow-lg">
                {artist.name}
              </h1>

              {socialMediaArray && socialMediaArray.length > 0 && (
                <div className="flex gap-2 pointer-events-auto">
                  {socialMediaArray.map((media, index) => (
                    <motion.a
                      key={index}
                      href={media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-9 h-9 bg-black/40 backdrop-blur-sm rounded-lg border border-white/20 text-white/80 hover:text-white hover:bg-black/60 transition-all duration-200 flex items-center justify-center"
                      title={media.platform}
                    >
                      {media.platform.toLowerCase().includes('instagram') && <img src="/icons/Instagram_icon.png" alt="Instagram" className="w-4 h-4" />}
                      {media.platform.toLowerCase().includes('youtube') && <img src="/icons/Youtube_icon.png" alt="YouTube" className="w-4 h-4" />}
                      {media.platform.toLowerCase().includes('spotify') && <img src="/icons/Spotify_icon.svg.png" alt="Spotify" className="w-4 h-4" />}
                      {media.platform.toLowerCase().includes('soundcloud') && <img src="/icons/soundcloud_icon.png" alt="SoundCloud" className="w-4 h-4" />}
                      {media.platform.toLowerCase().includes('x') && <img src="/icons/x_icon.png" alt="X" className="w-4 h-4" />}
                      {media.platform.toLowerCase().includes('facebook') && <span className="text-base">📘</span>}
                      {media.platform.toLowerCase().includes('tiktok') && <span className="text-base">🎵</span>}
                      {media.platform.toLowerCase().includes('linkedin') && <span className="text-base">💼</span>}
                      {media.platform.toLowerCase().includes('twitch') && <span className="text-base">🎮</span>}
                      {media.platform.toLowerCase().includes('discord') && <span className="text-base">💬</span>}
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
                       <Globe className="w-4 h-4" />}
                    </motion.a>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Compact name — visible when collapsed */}
            <motion.div
              animate={{ opacity: imageCollapsed ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center px-5 pointer-events-none"
            >
              <h2 className="text-base font-semibold text-white truncate pr-10">{artist.name}</h2>
            </motion.div>
          </div>

          {/* Scrollable Content */}
          <div
            ref={contentRef}
            onScroll={handleScroll}
            className="overflow-y-auto flex-1 overscroll-contain"
          >
            <div className="p-5 sm:p-7">

              {/* Bio */}
              {artist.bio && (
                <p className="text-white/75 text-sm sm:text-base leading-relaxed mb-5">
                  {artist.bio}
                </p>
              )}

              {/* Tags row: website · genre · bookable · se profil */}
              <div className="flex flex-wrap items-center gap-2 mb-8">
                {artist.website && (
                  <a
                    href={artist.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-colors text-sm"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website</span>
                  </a>
                )}

                {artist.genre && (
                  <span className="px-3 py-1.5 rounded-full bg-white/8 border border-white/15 text-white/70 text-sm">
                    {artist.genre}
                  </span>
                )}

                {artist.isBookable && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm">
                    <Calendar className="w-3.5 h-3.5" />
                    Tilgængelig til booking
                  </span>
                )}

                {artist.isBookable && (
                  <Link
                    to={`/booking/artists/${getArtistUrl(artist.name)}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:text-blue-200 hover:bg-blue-500/30 transition-colors text-sm font-medium"
                  >
                    Se profil
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {/* Embeddings Section */}
              <div className="pt-5 border-t border-white/8">
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
                  <div className="text-center py-8 text-white/40">
                    <Music className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Ingen musik eller medie tilgængeligt endnu</p>
                    {!isAdmin && (
                      <p className="text-xs mt-1 text-white/30">Tjek tilbage senere</p>
                    )}
                  </div>
                )}

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

      {/* Lightbox */}
      <AnimatePresence>
        {imageExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setImageExpanded(false)}
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center pt-24 pb-8 px-4 cursor-zoom-out"
          >
            <motion.img
              src={constructFullUrl(artist.imageUrl)}
              alt={artist.name}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl cursor-zoom-out"
              onClick={() => setImageExpanded(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default ArtistModal;
