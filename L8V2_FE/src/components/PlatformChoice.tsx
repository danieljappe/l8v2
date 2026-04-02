import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Scene from './3DScene';
// No subdomain utilities needed

const PlatformChoice: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const [animationsReady, setAnimationsReady] = useState(false);

  // Preload images in background (non-blocking, for better UX)
  useEffect(() => {
    const imageUrls = ['/l8logo.webp'];
    imageUrls.forEach((url) => {
      const img = new Image();
      img.src = url; // Preload in background
    });
  }, []);

  // Prioritize 3D scene - show content when scene is ready
  // Images can load in background
  useEffect(() => {
    if (sceneReady) {
      // Small delay to ensure smooth transition, then trigger animations
      const timer = setTimeout(() => {
        setAnimationsReady(true);
        // Show content after animations start
        setTimeout(() => {
          setIsLoading(false);
        }, 100);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [sceneReady]);

  const handleSceneReady = () => {
    const win = window as Window & { __sceneTimeout?: number };
    if (win.__sceneTimeout) {
      clearTimeout(win.__sceneTimeout);
      delete win.__sceneTimeout;
    }
    setSceneReady(true);
  };

  const handlePlatformChoice = (platform: string) => {
    localStorage.setItem('l8-platform-choice', platform);
    if (platform === 'events') {
      navigate('/home');
    } else if (platform === 'booking') {
      navigate('/booking');
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* 3D Background - Always visible, serves as loading screen */}
      <div className="absolute inset-0 z-0">
        <Scene onReady={handleSceneReady} />
      </div>
      
      {/* Split Background Overlay with Circular Cutout - Only show when ready */}
      {animationsReady && (
      <div className="absolute inset-0 flex flex-col md:flex-row z-10">
        {/* Left Side - Events */}
        <motion.div 
          className="flex-1 relative"
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        >
          <div 
            className="absolute inset-0 bg-gradient-to-br from-l8-dark/50 to-l8-blue-dark/50 backdrop-blur-sm hidden md:block"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 100%)',
              maskImage: 'radial-gradient(ellipse 140px 160px at 100% 50%, transparent 140px, black 140px)',
              WebkitMaskImage: 'radial-gradient(ellipse 140px 160px at 100% 50%, transparent 140px, black 140px)'
            }}
          />
          <div 
            className="absolute inset-0 bg-black/10 hidden md:block"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 100%)',
              maskImage: 'radial-gradient(ellipse 140px 160px at 100% 50%, transparent 140px, black 140px)',
              WebkitMaskImage: 'radial-gradient(ellipse 140px 160px at 100% 50%, transparent 140px, black 140px)'
            }}
          />
          {/* Mobile overlay without mask */}
          <div className="absolute inset-0 bg-gradient-to-br from-l8-dark/50 to-l8-blue-dark/50 backdrop-blur-sm md:hidden" />
          <div className="absolute inset-0 bg-black/10 md:hidden" />
        </motion.div>
        
        {/* Right Side - Booking */}
        <motion.div 
          className="flex-1 relative"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        >
          <div 
            className="absolute inset-0 bg-gradient-to-br from-booking-dark/50 to-booking-dark/70 backdrop-blur-sm hidden md:block"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 100%)',
              maskImage: 'radial-gradient(ellipse 140px 160px at 0% 50%, transparent 140px, black 140px)',
              WebkitMaskImage: 'radial-gradient(ellipse 140px 160px at 0% 50%, transparent 140px, black 140px)'
            }}
          />
          <div 
            className="absolute inset-0 bg-black/10 hidden md:block"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 100%)',
              maskImage: 'radial-gradient(ellipse 140px 160px at 0% 50%, transparent 140px, black 140px)',
              WebkitMaskImage: 'radial-gradient(ellipse 140px 160px at 0% 50%, transparent 140px, black 140px)'
            }}
          />
          {/* Mobile overlay without mask */}
          <div className="absolute inset-0 bg-gradient-to-br from-booking-dark/50 to-booking-dark/70 backdrop-blur-sm md:hidden" />
          <div className="absolute inset-0 bg-black/10 md:hidden" />
        </motion.div>
      </div>
      )}


      {/* Content */}
      {!isLoading && (
      <motion.div 
        className="relative z-30 h-screen flex flex-col md:flex-row"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Left Side - Events */}
        <motion.div 
          className="flex-1 flex items-center justify-center relative group cursor-pointer min-h-[50vh] md:min-h-full"
          onClick={() => handlePlatformChoice('events')}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {/* Left Side Hover Effects */}
          <div className="absolute left-1/4 top-1/4 w-32 h-32 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute left-1/4 bottom-1/4 w-32 h-32 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute left-1/3 top-1/3 w-24 h-24 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute left-1/3 bottom-1/3 w-24 h-24 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="text-center px-8 max-w-md">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-8"
            >
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition-all duration-300">
                <img 
                  src="/l8logo.webp" 
                  alt="L8 Logo" 
                  className="w-12 h-12 object-contain rounded-2xl"
                />
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-2">L8 Events</h1>
              <h2 className="text-lg sm:text-xl md:text-2xl font-light text-white/60">Udforsk begivenheder</h2>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-white/60 text-base sm:text-lg max-w-md mx-auto mb-8 group-hover:text-white/80 transition-colors duration-300"
            >
              Udforsk vores kommende og tidligere events. Køb din billet idag!
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex items-center justify-center space-x-2 text-white/60 group-hover:text-white transition-colors duration-300"
            >
              <span className="text-sm font-medium">Kom i gang</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </motion.div>

          </div>
        </motion.div>

        {/* Right Side - Booking */}
        <motion.div 
          className="flex-1 flex items-center justify-center relative group cursor-pointer min-h-[50vh] md:min-h-full"
          onClick={() => handlePlatformChoice('booking')}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {/* Right Side Hover Effects */}
          <div className="absolute right-1/4 top-1/4 w-32 h-32 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute right-1/4 bottom-1/4 w-32 h-32 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute right-1/3 top-1/3 w-24 h-24 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute right-1/3 bottom-1/3 w-24 h-24 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="text-center px-8 max-w-md">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mb-8"
            >
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition-all duration-300">
                <img 
                  src="/l8logo.webp" 
                  alt="L8 Logo" 
                  className="w-12 h-12 object-contain rounded-2xl"
                />
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-2">L8 Booking</h1>
              <h2 className="text-lg sm:text-xl md:text-2xl font-light text-white/60">Book artister</h2>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-white/60 text-base sm:text-lg max-w-md mx-auto mb-8 group-hover:text-white/80 transition-colors duration-300"
            >
              Udforsk og book talentfulde artister til din næste begivenhed
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="flex items-center justify-center space-x-2 text-white/60 group-hover:text-white transition-colors duration-300"
            >
              <span className="text-sm font-medium">Udforsk booking</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </motion.div>

          </div>
        </motion.div>
      </motion.div>
      )}
    </div>
  );
};

export default PlatformChoice;
