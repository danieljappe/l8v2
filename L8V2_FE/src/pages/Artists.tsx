import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Music, Globe } from 'lucide-react';
import { apiService, Artist } from '../services/api';
import ArtistModal from '../components/ArtistModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { constructFullUrl } from '../utils/imageUtils';

const Artists: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('all');

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

  // Filter artists based on search and genre
  const filteredArtists = artists.filter(artist => {
    const matchesSearch = artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (artist.bio && artist.bio.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (artist.genre && artist.genre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesGenre = genreFilter === 'all' || artist.genre === genreFilter;
    return matchesSearch && matchesGenre;
  });

  // Helper function to get social media count (handles both string and array formats)
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

  // Get unique genres for filter
  const genres = ['all', ...Array.from(new Set(artists.map(artist => artist.genre).filter(Boolean)))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen overflow-x-hidden">
      {/* Main Content */}
      <main className="relative z-10 pt-20 pb-16">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-l8-blue to-l8-blue-light rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              Artister igennem tiden
            </h1>
            <p className="text-base text-white/80 max-w-2xl mx-auto">
              L8 Hall of Fame - Skud ud til alle de artister der har optrådt hos L8. <br/>Her kan du få et overblik over hvem de er.
            </p>
          </motion.div>
        </div>

        {/* Search and Filter Section */}
      {artists.length > 0 && (
        <div className="container mx-auto px-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Søg efter kunstnere, genre eller beskrivelse..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-l8-blue focus:border-transparent transition-all duration-200"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Genre Filter */}
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-l8-blue focus:border-transparent transition-all duration-200"
              >
                {genres.map(genre => (
                  <option key={genre} value={genre} className="bg-gray-800 text-white">
                    {genre === 'all' ? 'Alle Genrer' : genre}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Results Count */}
            <div className="mt-3 text-center text-white/80">
              <span className="text-sm">
                {filteredArtists.length} af {artists.length} kunstnere
              </span>
            </div>
          </div>
        </div>
      )}

        {/* Artists Grid */}
        <div className="container mx-auto px-4 py-12">
        {filteredArtists.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-white/60" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {artists.length === 0 ? 'Ingen Kunstnere Endnu' : 'Ingen Resultater'}
            </h3>
            <p className="text-white/60">
              {artists.length === 0 
                ? 'Kunstnere vil blive tilføjet snart' 
                : 'Prøv at ændre dine søgekriterier'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {filteredArtists.map((artist, index) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleArtistClick(artist)}
                className="group cursor-pointer"
              >
                <div className="relative">
                  {/* Artist Image Card */}
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden border-4 border-white/10 group-hover:border-l8-blue/50 transition-all duration-300 shadow-lg group-hover:shadow-2xl bg-gradient-to-br from-gray-100 to-gray-200">
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
                        <div className="w-20 h-20 bg-gradient-to-br from-l8-blue to-l8-blue-light rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
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
                    </div>
                    
                    {/* Social Media Count Badge */}
                    {artist.socialMedia && getSocialMediaCount(artist) > 0 && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1 shadow-sm border border-gray-200/50">
                          <span className="text-sm font-semibold text-gray-800">
                            {getSocialMediaCount(artist)} social
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Artist Info Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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

                    {/* Click Indicator */}
                    <div className="absolute top-2 right-2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>

                  {/* Artist Info Below Image */}
                  <div className="mt-4 text-center">
                    <h3 className="text-white font-bold text-lg mb-1 group-hover:text-l8-beige transition-colors">
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
                          <span>{getSocialMediaCount(artist)} platforms</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        </div>

        {/* Artist Modal */}
        <ArtistModal artist={selectedArtist} onClose={handleCloseModal} isAdmin={false} />
      </main>
    </div>
  );
};

export default Artists; 