import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, Calendar, User } from 'lucide-react';
import { Artist, User as ApiUser } from '../services/api';

interface BookingModalProps {
  artist: Artist | null;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ artist, onClose }) => {
  if (!artist || !artist.isBookable) return null;

  const bookingUser = artist.bookingUser as ApiUser | undefined;

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
          className="relative w-full max-w-lg bg-gradient-to-br from-booking-dark via-booking-dark to-booking-teal-dark rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
        >
          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/70 rounded-full transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </motion.button>

          {/* Content */}
          {bookingUser ? (
            <>
              {/* Hero Section with Large Image */}
              <div className="relative pt-12 pb-8 px-6 text-center bg-gradient-to-b from-booking-teal/20 to-transparent">
                {/* Large User Image */}
                <div className="flex justify-center mb-4">
                  {bookingUser.imageUrl ? (
                    <div className="relative">
                      <img
                        src={bookingUser.imageUrl}
                        alt={bookingUser.firstName && bookingUser.lastName
                          ? `${bookingUser.firstName} ${bookingUser.lastName}`
                          : 'Booking Contact'}
                        className="w-32 h-32 rounded-full object-cover border-4 border-white/30 shadow-2xl"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-booking-dark flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                      </div>
                      <div className="w-32 h-32 bg-gradient-to-br from-booking-orange to-booking-teal rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30 hidden">
                        <User className="w-16 h-16 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-booking-orange to-booking-teal rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30">
                      <User className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>

                {/* User Name and Title */}
                <div className="space-y-1">
                  <h3 className="text-2xl font-semibold text-white">
                    {bookingUser.firstName && bookingUser.lastName
                      ? `${bookingUser.firstName} ${bookingUser.lastName}`
                      : 'Booking Contact'}
                  </h3>
                  <p className="text-sm text-white/70 font-light">Booking Agent</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="px-6 space-y-3 pb-6">
                {/* Email */}
                <a
                  href={`mailto:${bookingUser.email}?subject=Booking Request: ${artist.name}`}
                  className="flex items-center space-x-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 group border border-white/10 hover:border-booking-teal/50"
                >
                  <div className="p-2 bg-booking-teal/20 rounded-lg group-hover:bg-booking-teal/30 transition-colors">
                    <Mail className="w-5 h-5 text-booking-teal group-hover:text-booking-orange transition-colors" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs text-white/50 mb-0.5">Email</p>
                    <span className="text-white group-hover:text-booking-teal transition-colors font-medium">
                      {bookingUser.email}
                    </span>
                  </div>
                </a>

                {/* Phone */}
                {bookingUser.phoneNumber && (
                  <a
                    href={`tel:${bookingUser.phoneNumber}`}
                    className="flex items-center space-x-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 group border border-white/10 hover:border-booking-teal/50"
                  >
                    <div className="p-2 bg-booking-teal/20 rounded-lg group-hover:bg-booking-teal/30 transition-colors">
                      <Phone className="w-5 h-5 text-booking-teal group-hover:text-booking-orange transition-colors" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs text-white/50 mb-0.5">Telefon</p>
                      <span className="text-white group-hover:text-booking-teal transition-colors font-medium">
                        {bookingUser.phoneNumber}
                      </span>
                    </div>
                  </a>
                )}
              </div>

              {/* Footer Message */}
              <div className="px-6 pb-6 pt-4 border-t border-white/10">
                <p className="text-sm text-white/60 text-center leading-relaxed">
                  Kontakt <span className="text-white font-medium">{bookingUser.firstName && bookingUser.lastName ? `${bookingUser.firstName} ${bookingUser.lastName.split(' ')[0]}` : 'the booking agent'}</span> for at booke <span className="text-white font-medium">{artist.name}</span> til dit event
                </p>
              </div>

              {/* Close Button */}
              <div className="px-6 pb-6">
                <button
                  onClick={onClose}
                  className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full transition-all duration-300 border border-white/20 hover:border-white/30"
                >
                  Luk
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 px-6">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-white/60" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Booking Information Not Available
              </h3>
              <p className="text-white/60 mb-6 leading-relaxed">
                Kontakt os på e-mail{' '}
                <a
                  href="mailto:booking@l8events.dk"
                  className="text-booking-teal hover:text-booking-orange transition-colors font-medium"
                >
                  booking@l8events.dk
                </a>
                {' '}for at booke {artist.name} til dit event.
              </p>
              <a
                href={`mailto:booking@l8events.dk?subject=Booking Request: ${artist.name}`}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-booking-orange to-booking-teal text-white font-semibold rounded-full hover:from-booking-orange-dark hover:to-booking-teal-dark transition-all duration-300 shadow-lg hover:shadow-xl mb-6"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email</span>
              </a>
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full transition-all duration-300 border border-white/20"
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingModal;
