import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Music, Star, Globe, Instagram, Search, Filter, Play, Calendar, Phone, Mail, Menu, X, Facebook, Youtube } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { apiService, Artist } from '../services/api';
import ArtistModal from '../components/ArtistModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { constructFullUrl } from '../utils/imageUtils';
import { useSEO } from '../hooks/useSEO';

const Booking: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // SEO optimization
  useSEO({
    title: 'L8 Booking - Book Kunstnere til Din Event',
    description: 'Book talentfulde kunstnere til din event gennem L8 Booking. Udforsk vores portfolio af DJs, producere og musikere. Professionel booking service for events i Danmark.',
    keywords: 'L8 Booking, book kunstnere, event booking, DJ booking, producer booking, musik booking, event management, kunstnere til events, booking service',
    url: '/booking'
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Booking platform navigation
  const navItems = [
    { name: 'Booking', path: '/booking', icon: Users },
    { name: 'Kunstnere', path: '/artists', icon: Music },
    { name: 'Om Os', path: '/about', icon: Star },
    { name: 'Kontakt', path: '/contact', icon: Phone },
  ];

  const socialLinks = [
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
    { name: 'YouTube', icon: Play, href: 'https://youtube.com' }
  ];

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
    // Note: Price and availability filters would need additional data fields
    return matchesSearch && matchesGenre;
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
    <div className="min-h-screen bg-gradient-to-br from-booking-dark via-booking-dark to-booking-teal-dark">
      {/* Booking Platform Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-black/80 backdrop-blur-lg' : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/booking">
              <div className="flex items-center space-x-2">
                <img 
                  src="/l8logo.webp" 
                  alt="L8 Logo" 
                  className="w-10 h-10 object-contain rounded-xl"
                />
                <div>
                  <span className="text-white font-bold text-xl">L8 Booking</span>
                  <div className="text-white/60 text-xs">booking.l8events.dk</div>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path}>
                    <div
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                        location.pathname === item.path
                          ? 'bg-white/10 text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}
              
              {/* Cross-reference to Events */}
              <div className="border-l border-white/20 pl-4">
                <Link to="/events">
                  <div className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors text-white/60 hover:text-white hover:bg-white/5">
                    <Calendar className="w-5 h-5" />
                    <span>L8 Events</span>
                  </div>
                </Link>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-white/60 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm md:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[240px] bg-gradient-to-br from-blue-900/95 via-cyan-900/95 to-indigo-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl md:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Menu Header */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img 
                        src="/l8logo.webp" 
                        alt="L8 Logo" 
                        className="w-8 h-8 object-contain rounded-lg"
                      />
                      <span className="text-white font-bold text-lg">L8 Booking</span>
                    </div>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 text-white/60 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 flex items-center justify-center">
                  <div className="w-full px-4 space-y-4">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block"
                        >
                          <motion.div
                            whileHover={{ x: 5 }}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                              location.pathname === item.path
                                ? 'bg-white/10 text-white shadow-lg'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-base">{item.name}</span>
                          </motion.div>
                        </Link>
                      );
                    })}
                    
                    {/* Cross-reference Link */}
                    <div className="border-t border-white/20 pt-4">
                      <Link
                        to="/events"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block"
                      >
                        <motion.div
                          whileHover={{ x: 5 }}
                          className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 text-white/60 hover:text-white hover:bg-white/5"
                        >
                          <Calendar className="w-5 h-5" />
                          <span className="text-base">L8 Events</span>
                        </motion.div>
                      </Link>
                    </div>
                  </div>
                </nav>

                {/* Social Links */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex justify-center space-x-4">
                    {socialLinks.map((social) => {
                      const Icon = social.icon;
                      return (
                        <motion.a
                          key={social.name}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/60 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          <Icon className="w-5 h-5" />
                        </motion.a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </header>
      {/* Featured Artists Landing Section */}
      <div className="relative min-h-screen overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-booking-dark via-booking-dark to-booking-teal-dark">
          <div className="absolute inset-0 bg-black/5" />
        </div>
        
        {/* Header */}
        <div className="relative z-10 pt-32 pb-16">
          <div className="text-center px-4 max-w-4xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-6xl md:text-8xl font-light text-white mb-6">
                L8 Booking
              </h1>
              <p className="text-xl md:text-2xl text-white/60 mb-8 max-w-2xl mx-auto font-light">
                Udforsk og book talentfulde kunstnere til din event. Se også vores <Link to="/events" className="text-booking-orange hover:text-booking-teal transition-colors underline">kommende events</Link> og <Link to="/about" className="text-booking-orange hover:text-booking-teal transition-colors underline">lær mere om L8 Events</Link>.
              </p>
            </motion.div>
          </div>

           {/* Modern Featured Artists Grid */}
           <div className="container mx-auto px-4">
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 max-w-7xl mx-auto">
               {filteredArtists.slice(0, 12).map((artist, index) => (
                 <motion.div
                   key={artist.id}
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.6, delay: index * 0.08 }}
                   whileHover={{ scale: 1.02, y: -8 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => handleArtistClick(artist)}
                   className="group cursor-pointer"
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
               ))}
             </div>

            {/* View All Button */}
            {filteredArtists.length > 12 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="text-center mt-12"
              >
                <button
                  onClick={() => {
                    const artistsSection = document.getElementById('artists-section');
                    artistsSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-light rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  Se Alle Kunstnere ({artists.length})
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border border-white/30 rounded-full flex justify-center"
          >
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2" />
          </motion.div>
        </div>
      </div>

      {/* Minimal Search Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Søg kunstnere..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-300 text-lg font-light"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
          </div>
          
          {/* Minimal Filter */}
          <div className="flex justify-center mt-6 space-x-4">
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
      </div>

       {/* Modern Artists Grid */}
       <div id="artists-section" className="container mx-auto px-4 pb-20">
         {filteredArtists.length === 0 ? (
           <div className="text-center py-20">
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
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
             {filteredArtists.map((artist, index) => (
               <motion.div
                 key={artist.id}
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ duration: 0.6, delay: index * 0.05 }}
                 whileHover={{ scale: 1.02, y: -8 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={() => handleArtistClick(artist)}
                 className="group cursor-pointer"
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
             ))}
           </div>
         )}
       </div>

      {/* Artist Modal */}
      <ArtistModal artist={selectedArtist} onClose={handleCloseModal} isAdmin={false} />
    </div>
  );
};

export default Booking;
