import React from 'react';
import { motion } from 'framer-motion';
import { Users, Music, Star, Globe, Instagram, Search, Calendar, Phone, Mail, Menu, X, Facebook, Youtube, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const BookingHome: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: 'Talentfulde Artister',
      description: 'Udforsk vores hold af spirrende artister'
    },
    {
      icon: Calendar,
      title: 'Nem Booking',
      description: 'Book dine favorit artist direkte gennem vores platform'
    },
    {
      icon: Star,
      title: 'Ny Energi',
      description: 'Hos os finder du Danmarks næste bølge af artister'
    }
  ];

  const stats = [
    { number: '50+', label: 'Artister' },
    { number: '100+', label: 'Bookinger' },
    { number: '5', label: 'Års Erfaring' },
    { number: '98%', label: 'Tilfredshed' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-booking-dark via-booking-dark to-booking-teal-dark">
      {/* Hero Section */}
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
                Book talentfulde artister til din næste begivenhed
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/booking/artists">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-white text-blue-900 font-semibold rounded-full hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Se Kunstnere
                    <ArrowRight className="inline-block w-5 h-5 ml-2" />
                  </motion.button>
                </Link>
                <Link to="/booking/contact">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
                  >
                    Kontakt Os
                  </motion.button>
                </Link>
              </div>
            </motion.div>
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

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
              Hvorfor Vælge L8 Booking?
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto font-light">
              Vi forbinder dig med artisterne og sikrer en smooth oplevelse.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-booking-orange to-booking-teal rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-white/60 font-light leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-12 max-w-4xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Klar til at Booke?
          </h2>
          <p className="text-xl text-white/60 mb-8 font-light">
            Udforsk vores artister og find det perfekte match til dit næste event
          </p>
          <Link to="/booking/artists">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-booking-orange to-booking-teal text-white font-semibold rounded-full hover:from-booking-orange-dark hover:to-booking-teal-dark transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Start Booking Nu
              <ArrowRight className="inline-block w-5 h-5 ml-2" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingHome;
