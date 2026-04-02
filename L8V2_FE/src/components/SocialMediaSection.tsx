import React from 'react';
import { motion } from 'framer-motion';

const SocialMediaSection: React.FC = () => {
  const socialLinks = [
    {
      name: 'Facebook',
      icon: '/icons/facebook_icon.png',
      href: 'https://www.facebook.com/profile.php?id=61556066605549',
    },
    {
      name: 'TikTok',
      icon: '/icons/tiktokicon.png',
      href: 'https://www.tiktok.com/@aldrigl8',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 12 },
    },
  };

  return (
    <section className="py-16 px-4 sm:px-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="w-full max-w-screen-xl mx-auto"
      >
        {/* Heading */}
        <motion.div variants={itemVariants} className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Følg Med
          </h2>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto">
            Hold dig opdateret på vores events, kunstnere og de seneste nyheder fra L8 Events
          </p>
        </motion.div>

        {/* Main layout: Instagram left | FB + TikTok right */}
        <div className="flex flex-col md:flex-row gap-6 items-stretch">

          {/* Instagram widget */}
          <motion.div
            variants={itemVariants}
            className="w-full md:flex-[3] border border-l8-blue/10 rounded-3xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: '#fafafa', minHeight: 400 }}
          >
            <iframe
              src="https://emb.fouita.com/widget/0x34cf9e/ftbngklcwg"
              title="Carousel Instagram Feed"
              width="100%"
              height="720"
              frameBorder="0"
              scrolling="no"
              className="w-full block"
              style={{ display: 'block', minHeight: 400 }}
              allowFullScreen
            />
          </motion.div>

          {/* Facebook + TikTok — stacked vertically on desktop, side-by-side on mobile */}
          <div className="flex flex-row md:flex-col gap-4 md:gap-6 md:flex-1">
            {socialLinks.map((social) => (
              <motion.a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                variants={itemVariants}
                whileHover={{ scale: 1.04, y: -5 }}
                whileTap={{ scale: 0.96 }}
                className="flex-1 group bg-white/[0.04] backdrop-blur-xl rounded-3xl border border-l8-blue/15
                  shadow-2xl hover:bg-white/[0.08] transition-colors duration-300
                  flex flex-col items-center justify-center gap-4 p-6 text-center min-h-[140px]"
              >
                {/* Icon */}
                <div className="p-3 bg-white/10 group-hover:bg-white/20 rounded-2xl transition-colors duration-300 shrink-0">
                  <img
                    src={social.icon}
                    alt={social.name}
                    className={`${social.name === 'TikTok' ? 'w-8 h-8' : 'w-6 h-6'} object-contain`}
                  />
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold text-white group-hover:text-l8-beige transition-colors">
                  {social.name}
                </h3>

                {/* CTA */}
                <div className="flex items-center gap-1.5 text-l8-beige group-hover:text-l8-beige-light transition-colors">
                  <span className="text-sm font-medium">Besøg {social.name}</span>
                  <svg
                    className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </motion.a>
            ))}
          </div>

        </div>
      </motion.div>
    </section>
  );
};

export default SocialMediaSection;
