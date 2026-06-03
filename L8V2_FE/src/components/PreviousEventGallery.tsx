import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Share2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import { usePastEvents, useGalleryImagesByEvent } from '../hooks/useApi';
import { constructFullUrl } from '../utils/imageUtils';
import type { GalleryImage } from '../services/api';
import { slugify } from '../utils/slugUtils';

const PreviousEventGallery: React.FC = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const { data: pastEvents, loading: eventsLoading, error: eventsError } = usePastEvents(1);
  const recentPastEvent = pastEvents?.[0] ?? null;
  const { data: eventGalleryImages, loading: galleryLoading, error: galleryError } = useGalleryImagesByEvent(recentPastEvent?.id, 4);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  // Images arrive pre-filtered and pre-ordered from the API (ORDER BY createdAt ASC LIMIT 4)
  const displayImages = eventGalleryImages ?? [];

  // Modal handlers
  const handleImageClick = (image: GalleryImage, index: number) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handlePreviousImage = () => {
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : displayImages.length - 1;
    setCurrentImageIndex(newIndex);
    setSelectedImage(displayImages[newIndex]);
  };

  const handleNextImage = () => {
    const newIndex = currentImageIndex < displayImages.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(newIndex);
    setSelectedImage(displayImages[newIndex]);
  };

  // Show loading state
  if (galleryLoading || eventsLoading) {
    return (
      <section id="gallery" className="min-h-screen flex items-center justify-center p-4 snap-start">
        <LoadingSpinner size="lg" text="Indlæser galleri..." />
      </section>
    );
  }

  // Show error state
  if (galleryError || eventsError) {
    return (
      <section id="gallery" className="min-h-screen flex items-center justify-center p-4 snap-start">
        <div className="text-center">
          <p className="text-red-400 mb-4">Kunne ikke indlæse galleri</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-l8-blue hover:bg-l8-blue-dark text-white px-4 py-2 rounded-lg"
          >
            Prøv igen
          </button>
        </div>
      </section>
    );
  }

  // Format event date
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <section id="gallery" className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto max-w-6xl"
      >
        <motion.div variants={itemVariants} className="text-center mb-8 sm:mb-12">
          <motion.h2 
            variants={itemVariants}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Genoplev sidste events højdepunkter
          </motion.h2>
          <motion.p 
            variants={itemVariants}
            className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto px-4"
          >
            {recentPastEvent 
              ? `Genoplev magien fra vores seneste event "${recentPastEvent.title}" `
              : 'Genoplev magien fra vores mest elektriserende events med utrolige optrædener og uforglemmelige øjeblikke.'
            }
          </motion.p>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-white/[0.08] rounded-3xl border border-l8-blue/15 p-4 sm:p-6 md:p-8 shadow-2xl"
        >
          {/* Event Info */}
          <motion.div 
            variants={itemVariants}
            className="flex items-center justify-between mb-4 sm:mb-6"
          >
            <div>
              <motion.h3 
                variants={itemVariants}
                className="text-xl sm:text-2xl font-bold text-white"
              >
                {recentPastEvent?.title || 'Seneste Event'}
              </motion.h3>
              <motion.p 
                variants={itemVariants}
                className="text-white/60 text-sm sm:text-base"
              >
                {recentPastEvent 
                  ? `${formatEventDate(recentPastEvent.date)} • ${recentPastEvent.venue?.name || 'Lokation'}`
                  : 'Seneste event højdepunkter'
                }
              </motion.p>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </motion.button>
            </div>
          </motion.div>

          {/* Gallery Grid */}
          {displayImages.length > 0 ? (
            <motion.div 
              variants={containerVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6"
            >
              {displayImages.map((image, index) => (
              <motion.div 
                key={image.id}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="relative group cursor-pointer"
                onClick={() => handleImageClick(image, index)}
              >
                <div className="aspect-square rounded-2xl overflow-hidden">
                  <motion.img
                    src={image.url ? constructFullUrl(image.url) : ''}
                    alt={image.caption || `Galleri billede ${index + 1}`}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
                  ></motion.div>
                  {index === 0 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-full"
                      >
                        <Play className="w-4 h-4 sm:w-6 sm:w-6 text-white" />
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
          ) : (
            <motion.div 
              variants={itemVariants}
              className="text-center py-8 mb-4 sm:mb-6"
            >
              <p className="text-white/60 text-sm sm:text-base">
                Ingen galleri billeder tilgængelige for dette event
              </p>
            </motion.div>
          )}

          {/* Stats */}
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-2 gap-4 mb-4 sm:mb-6"
          >
            {[
              { value: recentPastEvent?.eventArtists?.length?.toString() || '6', label: 'Kunstnere' },
              { value: '8t', label: 'Varighed' }
            ].map((stat) => (
              <motion.div 
                key={stat.label}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                className="text-center bg-white/5 p-3 sm:p-4 rounded-2xl border border-white/10"
              >
                <motion.p 
                  variants={itemVariants}
                  className="text-xl sm:text-2xl font-bold text-white"
                >
                  {stat.value}
                </motion.p>
                <motion.p 
                  variants={itemVariants}
                  className="text-white/60 text-xs sm:text-sm"
                >
                  {stat.label}
                </motion.p>
              </motion.div>
            ))}
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {recentPastEvent && (
              <motion.button 
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/events/${slugify(recentPastEvent.title)}`)}
                className="inline-flex items-center space-x-2 bg-l8-blue hover:bg-l8-blue-dark text-white font-medium px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 border border-l8-blue/20 text-sm sm:text-base"
              >
                <span>Se Event</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
            
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Image Modal */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative max-w-6xl max-h-[90vh] bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation buttons */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={handlePreviousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors duration-200"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors duration-200"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img
                src={selectedImage.url ? constructFullUrl(selectedImage.url) : ''}
                alt={selectedImage.caption || `Galleri billede ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                style={{ maxHeight: 'calc(100vh - 80px)' }}
              />
            </div>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center bg-black bg-opacity-50 backdrop-blur-sm px-4 py-2 rounded-lg">
              <p className="text-white text-sm font-medium">
                {selectedImage.caption || `Galleri billede ${currentImageIndex + 1}`}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
};

export default PreviousEventGallery;