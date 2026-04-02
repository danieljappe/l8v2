import React, { useState, useEffect } from 'react';
import { Menu, X, Music, Calendar, Info, Phone, Instagram, Facebook, Youtube, Image, Users, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Breadcrumbs from '../Breadcrumbs';
import { motion, AnimatePresence } from 'framer-motion';

interface SharedHeaderProps {
  platform?: 'events' | 'booking';
}

const SharedHeader: React.FC<SharedHeaderProps> = ({ platform = 'events' }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

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

  const getNavItems = () => {
    const baseItems = [
      { name: 'Begivenheder', path: '/events', icon: Calendar },
      { name: 'Kunstnere', path: '/artists', icon: Users },
      { name: 'Galleri', path: '/gallery', icon: Image },
      { name: 'Om Os', path: '/about', icon: Info },
      { name: 'Kontakt', path: '/contact', icon: Phone },
      { name: 'Admin', path: '/admin', icon: Settings }
    ];

    if (platform === 'booking') {
      return [
        { name: 'Booking', path: '/booking', icon: Users },
        { name: 'Kunstnere', path: '/artists', icon: Music },
        { name: 'Om Os', path: '/about', icon: Info },
        { name: 'Kontakt', path: '/contact', icon: Phone },
        { name: 'Admin', path: '/admin', icon: Settings }
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  // Cross-reference navigation based on current platform
  const getCrossReferenceLink = () => {
    const currentPath = location.pathname;
    if (currentPath.startsWith('/booking')) {
      return { name: 'L8 Events', path: '/events', icon: Calendar };
    } else if (currentPath.startsWith('/events') || currentPath === '/') {
      return { name: 'L8 Booking', path: '/booking', icon: Users };
    }
    return null;
  };

  const crossReferenceLink = getCrossReferenceLink();

  const socialLinks = [
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
    { name: 'YouTube', icon: Youtube, href: 'https://youtube.com' }
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/80 backdrop-blur-lg' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/">
            <div className="flex items-center space-x-2">
              <img 
                src="/l8logo.webp" 
                alt="L8 Logo" 
                className="w-10 h-10 object-contain rounded-xl"
              />
              <span className="text-white font-bold text-xl">L8</span>
              {platform && (
                <span className="text-white/60 text-sm font-medium">
                  {platform === 'booking' ? 'Booking' : 'Events'}
                </span>
              )}
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
            
            {/* Cross-reference Link */}
            {crossReferenceLink && (
              <div className="border-l border-white/20 pl-4">
                <Link to={crossReferenceLink.path}>
                  <div className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors text-white/60 hover:text-white hover:bg-white/5">
                    <crossReferenceLink.icon className="w-5 h-5" />
                    <span>{crossReferenceLink.name}</span>
                  </div>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white/60 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Breadcrumbs - Only show on events pages */}
        {location.pathname.startsWith('/events') && (
          <div className="pb-4">
            <Breadcrumbs />
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
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
              className={`fixed top-0 right-0 h-full w-[240px] bg-gradient-to-br backdrop-blur-xl border-l border-white/10 shadow-2xl md:hidden ${
                platform === 'booking' 
                  ? 'from-booking-dark/95 via-booking-dark/95 to-booking-teal-dark/95'
                  : 'from-l8-dark/95 via-l8-blue-dark/95 to-l8-blue/95'
              }`}
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
                      <span className="text-white font-bold text-lg">L8</span>
                      {platform && (
                        <span className="text-white/60 text-xs">
                          {platform === 'booking' ? 'Booking' : 'Events'}
                        </span>
                      )}
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
                    {crossReferenceLink && (
                      <div className="border-t border-white/20 pt-4">
                        <Link
                          to={crossReferenceLink.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block"
                        >
                          <motion.div
                            whileHover={{ x: 5 }}
                            className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 text-white/60 hover:text-white hover:bg-white/5"
                          >
                            <crossReferenceLink.icon className="w-5 h-5" />
                            <span className="text-base">{crossReferenceLink.name}</span>
                          </motion.div>
                        </Link>
                      </div>
                    )}
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
      </AnimatePresence>
    </header>
  );
};

export default SharedHeader;
