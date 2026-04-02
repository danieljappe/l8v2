import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Music, Star, Search } from 'lucide-react';
import { apiService, Artist } from '../services/api';
import ArtistModal from '../components/ArtistModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { constructFullUrl } from '../utils/imageUtils';

const BookingArtists: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('all');

  // Helper function to convert artist name to URL-friendly format
  const getArtistUrl = (artistName: string) => {
    return artistName.toLowerCase().replace(/\s+/g, '-');
  };

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        const response = await apiService.getArtists();
        if (response.error) {
          setError(response.error);
        } else if (response.data) {
          setArtists(response.data);
        }
      } catch (err) {
        setError('Failed to fetch artists');
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  const handleArtistClick = (artist: Artist) => {
    setSelectedArtist(artist);
  };

  const handleCloseModal = () => {
    setSelectedArtist(null);
  };

  // Filter artists based on search and filters
  const filteredArtists = artists.filter(artist => {
    const matchesSearch = artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (artist.bio && artist.bio.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (artist.genre && artist.genre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesGenre = genreFilter === 'all' || artist.genre === genreFilter;
    const isBookable = artist.isBookable;
    return matchesSearch && matchesGenre && isBookable;
  });

  // Get unique genres for filter
  const genres = ['all', ...Array.from(new Set(artists.map(artist => artist.genre).filter(Boolean)))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-booking-dark via-booking-dark to-booking-teal-dark">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-booking-dark via-booking-dark to-booking-teal-dark">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Artists</h2>
          <p className="text-white/60">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl font-light text-white mb-6">
                Vores Kunstnere
              </h1>
              <p className="text-xl text-white/60 max-w-2xl mx-auto font-light">
                Udforsk vores samling af talentfulde kunstnere og musikere
              </p>
            </motion.div>
          </div>

          {/* Search and Filter */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Søg kunstnere..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-300 text-lg font-light"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
            </div>
            
            {/* Filter */}
            <div className="flex justify-center space-x-4">
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="px-6 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-300 font-light"
              >
                {genres.map(genre => (
                  <option key={genre} value={genre} className="bg-gray-900 text-white">
                    {genre === 'all' ? 'Alle Genrer' : genre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Artists Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {filteredArtists.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                  <Music className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">
                  {artists.length === 0 ? 'Ingen Kunstnere Endnu' : 'Ingen Resultater'}
                </h3>
                <p className="text-slate-400">
                  {artists.length === 0 
                    ? 'Kunstnere vil blive tilføjet snart' 
                    : 'Prøv at ændre dine søgekriterier'
                  }
                </p>
              </div>
            ) : (
              filteredArtists.map((artist, index) => (
                <Link
                  key={artist.id}
                  to={`/booking/artists/${getArtistUrl(artist.name)}`}
                  className="group"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -8 }}
                    whileTap={{ scale: 0.98 }}
                    className="cursor-pointer"
                  >
                  <div className="relative">
                    {/* Modern Artist Card */}
                    <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800/30 to-slate-900/50 backdrop-blur-sm border border-white/5 group-hover:border-white/20 transition-all duration-500 shadow-lg group-hover:shadow-2xl group-hover:shadow-blue-500/10">
                      {artist.imageUrl ? (
                        <img
                          src={constructFullUrl(artist.imageUrl)}
                          alt={artist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      
                      {/* Fallback placeholder */}
                      <div className={`w-full h-full flex items-center justify-center ${artist.imageUrl ? 'hidden' : ''}`}>
                        <div className="w-20 h-20 bg-gradient-to-br from-booking-orange to-booking-teal rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-white text-3xl font-bold">
                            {artist.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Modern Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Modern Genre Badge */}
                      {artist.genre && (
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/20 backdrop-blur-sm text-blue-300 border border-blue-500/30 shadow-lg">
                            {artist.genre}
                          </span>
                        </div>
                      )}

                      {/* Availability Indicator */}
                      <div className="absolute top-4 right-4">
                        <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg animate-pulse" />
                      </div>
                    </div>

                    {/* Modern Artist Info */}
                    <div className="mt-5 text-center">
                      <h3 className="text-white font-semibold text-base mb-1 group-hover:text-blue-300 transition-colors">
                        {artist.name}
                      </h3>
                      <p className="text-slate-400 text-sm font-medium">{artist.genre}</p>
                    </div>
                  </div>
                  </motion.div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Artist Modal */}
        <ArtistModal artist={selectedArtist} onClose={handleCloseModal} isAdmin={false} />
    </div>
  );
};

export default BookingArtists;
