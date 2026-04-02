import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Calendar, User, Tag, ArrowLeft, ArrowRight, MapPin, Clock, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useGalleryImages } from '../hooks/useApi';
import { GalleryImage, Event, apiService } from '../services/api';
import { constructFullUrl } from '../utils/imageUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import { slugify } from '../utils/slugUtils';

const Gallery: React.FC = () => {
  const navigate = useNavigate();
  const { data: images, loading, error } = useGalleryImages();
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [eventMap, setEventMap] = useState<Record<string, Event>>({});

  // Filter published images - temporarily show all images for debugging
  const publishedImages = images || [];

  // Fetch events for event linking
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await apiService.getEvents();
        if (response.data) {
          // Create event map for quick lookup
          const map: Record<string, Event> = {};
          response.data.forEach(event => {
            map[event.id] = event;
          });
          setEventMap(map);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }
    };
    fetchEvents();
  }, []);

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


  const handleImageClick = (image: GalleryImage, index: number, event?: React.MouseEvent) => {
    // If the image is linked to an event and the click is on the event info area, navigate to event
    if (image.eventId && event?.target instanceof HTMLElement) {
      const eventInfoElement = event.target.closest('[data-event-info]');
      if (eventInfoElement) {
        const linkedEvent = eventMap[image.eventId];
        if (linkedEvent) {
          navigate(`/events/${slugify(linkedEvent.title)}`);
        } else {
          // Fallback to ID if event not found in map
          navigate(`/events/${image.eventId}`);
        }
        return;
      }
    }
    
    setSelectedImage(image);
    setCurrentImageIndex(index);
  };

  const handleEventNavigation = (eventId: string) => {
    const linkedEvent = eventMap[eventId];
    if (linkedEvent) {
      navigate(`/events/${slugify(linkedEvent.title)}`);
    } else {
      // Fallback to ID if event not found in map
      navigate(`/events/${eventId}`);
    }
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handlePreviousImage = () => {
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : publishedImages.length - 1;
    setCurrentImageIndex(newIndex);
    setSelectedImage(publishedImages[newIndex]);
  };

  const handleNextImage = () => {
    const newIndex = currentImageIndex < publishedImages.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(newIndex);
    setSelectedImage(publishedImages[newIndex]);
  };

  if (loading) {
    return (
      <div className="min-h-screen overflow-x-hidden">
        <Header />
        <main className="relative z-10 pt-20">
          <section className="min-h-screen flex items-center justify-center p-4 snap-start">
            <LoadingSpinner size="lg" text="Loading gallery..." />
          </section>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen overflow-x-hidden">
        <Header />
        <main className="relative z-10 pt-20">
          <section className="min-h-screen flex items-center justify-center p-4 snap-start">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div 
              className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl"
            >
              <p className="text-red-400 mb-4 text-lg">Failed to load gallery</p>
              <p className="text-white/70 mb-6">
                {error || 'Unknown error occurred'}
              </p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()} 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Retry
              </motion.button>
            </motion.div>
          </motion.div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />
      
      <main className="relative z-10 pt-20">
        <section className="min-h-screen flex items-center justify-center p-4 snap-start">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="container mx-auto max-w-7xl"
          >
            <motion.div variants={itemVariants} className="text-center mb-8 sm:mb-12">
              <motion.h1 
                variants={itemVariants}
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
              >
                Galleri
              </motion.h1>
              <motion.p 
                variants={itemVariants}
                className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto px-4"
              >
                Mærk viben fra tidligere events
              </motion.p>
            </motion.div>

            {publishedImages.length === 0 ? (
              <motion.div 
                variants={itemVariants}
                className="text-center py-12"
              >
                <motion.div 
                  className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl"
                >
                  <Camera className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <div className="text-white/70 text-lg mb-4">Ingen billeder fundet</div>
                  <p className="text-white/50 text-sm">
                    Billeder vil vises her når de er uploadet og publiceret.
                  </p>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                variants={containerVariants}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8"
              >
                {publishedImages.map((image, index) => {
                  const linkedEvent = image.eventId ? eventMap[image.eventId] : null;
                  return (
                    <motion.div
                      key={image.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => handleImageClick(image, index, e)}
                      className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden shadow-2xl cursor-pointer transition-all duration-300 group"
                    >
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={constructFullUrl(image.url)}
                          alt={image.caption || 'Gallery image'}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {linkedEvent && (
                          <div className="absolute top-3 left-3">
                            <span className="bg-blue-600 text-white px-3 py-1 text-xs font-medium rounded-full flex items-center shadow-lg">
                              <Calendar className="w-3 h-3 mr-1" />
                              Event
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <p className="text-sm font-medium">Klik for at se større</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        </section>
      </main>

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
              ×
            </button>

            {/* Navigation buttons */}
            {publishedImages.length > 1 && (
              <>
                <button
                  onClick={handlePreviousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors duration-200"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors duration-200"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image */}
            <div className="relative">
              <img
                src={constructFullUrl(selectedImage.url)}
                alt={selectedImage.caption || 'Gallery image'}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>

            {/* Image info */}
            <div className="p-6">
              <h3 className="text-white font-semibold text-xl mb-3">
                {selectedImage.caption || 'Untitled'}
              </h3>
              
              {/* Event Information in Modal */}
              {selectedImage.eventId && eventMap[selectedImage.eventId] && (
                <div className="mb-6 p-4 bg-blue-500/20 border border-blue-400/30 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-blue-200 font-medium">
                      <Calendar className="w-5 h-5 mr-2" />
                      {eventMap[selectedImage.eventId].title}
                    </div>
                    <button
                      onClick={() => handleEventNavigation(selectedImage.eventId!)}
                      className="flex items-center text-blue-300 hover:text-blue-200 transition-colors duration-200"
                    >
                      <span className="text-sm mr-1">Se event</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-blue-300">
                      <Clock className="w-4 h-4 mr-2" />
                      {new Date(eventMap[selectedImage.eventId].date).toLocaleDateString('da-DK')} kl. {eventMap[selectedImage.eventId].startTime}
                    </div>
                    {eventMap[selectedImage.eventId].venue && (
                      <div className="flex items-center text-sm text-blue-300">
                        <MapPin className="w-4 h-4 mr-2" />
                        {eventMap[selectedImage.eventId].venue?.name}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-white/70">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-purple-300" />
                  <span className="text-sm">
                    {new Date(selectedImage.createdAt).toLocaleDateString('da-DK', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                {selectedImage.photographer && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-purple-300" />
                    <span className="text-sm">{selectedImage.photographer}</span>
                  </div>
                )}
                {selectedImage.category && (
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-purple-300" />
                    <span className="text-sm">{selectedImage.category}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Gallery;