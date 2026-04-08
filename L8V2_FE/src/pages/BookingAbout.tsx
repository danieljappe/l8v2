import React from 'react';
import { motion } from 'framer-motion';
import { Mic2, Heart, Music } from 'lucide-react';

const BookingAbout: React.FC = () => {
  const items = [
    {
      icon: Mic2,
      title: 'Vores Mission',
      body: 'L8 Booking er opstået af en passion for dansk musik. Vi arbejder tæt med vækstlagets stemmer — de artister der er klar til at tage næste skridt, men mangler den rette platform.'
    },
    {
      icon: Heart,
      title: 'Hvad Vi Tror På',
      body: 'Vi tror på, at den bedste musik opstår, når kunstner og publikum er i perfekt harmoni. Vores job er at skabe de møder — og sørge for at alt det praktiske glider.'
    },
    {
      icon: Music,
      title: 'Hvad Vi Tilbyder',
      body: 'Fra første henvendelse til event-dag håndterer vi bookingprocessen. Du får direkte adgang til artisternes booking-kontakt, gennemsigtige priser og et dedikeret team bag dig.'
    }
  ];

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-light text-white mb-6">Om Os</h1>
            <p className="text-xl text-white/60 font-light max-w-2xl mx-auto">
              Vi er broen mellem nye talenter og etablerede scener
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-booking-orange to-booking-teal rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">{item.title}</h3>
                  <p className="text-white/60 font-light leading-relaxed text-sm">{item.body}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingAbout;
