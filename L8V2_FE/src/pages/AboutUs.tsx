import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Users, Heart, Rocket, Star, ArrowRight, Linkedin, Github, Mail, Phone, AlertCircle, RefreshCw } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useApi } from '../hooks/useApi';
import { useSEO } from '../hooks/useSEO';
import { apiService, User } from '../services/api';

const useCountAnimation = (end: number, duration: number = 2) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, end, { 
      duration,
      ease: [0.25, 0.1, 0.25, 1], // Custom easing for more natural counting
    });
    return controls.stop;
  }, [count, end, duration]);

  return rounded;
};

const AboutUs = () => {
  const { data: events, loading: eventsLoading } = useEvents();
  const { data: users, loading: usersLoading, error: usersError, refetch: refetchUsers } = useApi<User[]>(() => apiService.getUsers());
  const [eventCount, setEventCount] = useState(0);

  // SEO optimization
  useSEO({
    title: 'Om L8 Events - Vores Mission og Team',
    description: 'Lær mere om L8 Events - vi kuraterer events med fokus på den nye bølge af dansk musik og fungerer som bindeled mellem nye talenter og etablerede spillesteder. Siden marts 2024 har vi vokset fra festlokale til Distortion scene.',
    keywords: 'L8 Events om os, team, mission, dansk musik, vækstlaget musik, event management, musikkopplevelser, elektronisk musik, event organisatorer, musik fællesskab, spillesteder, kunstnere booking',
    url: '/about'
  });

  useEffect(() => {
    if (events && !eventsLoading) {
      setEventCount(events.length);
    }
  }, [events, eventsLoading]);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const statCardVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.8,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  // Stat Card Component to properly use hooks
  const StatCard = ({ stat, index }: { 
    stat: { 
      icon: React.ComponentType<{ className?: string }>, 
      value: number, 
      label: string, 
      suffix: string,
      duration: number
    }, 
    index: number
  }) => {
    const displayValue = stat.label === "Begivenheder" && eventsLoading ? 0 : stat.value;
    const count = useCountAnimation(displayValue, stat.duration);
    
    return (
      <motion.div
        variants={statCardVariants}
        whileHover="hover"
        className="text-center p-6 rounded-lg bg-black/30 backdrop-blur-sm cursor-pointer border border-white/10"
      >
        <motion.div
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
        >
          <stat.icon className="w-12 h-12 mx-auto mb-4 text-l8-blue" />
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.2 }}
          className="text-3xl font-bold text-l8-blue mb-2"
        >
          {stat.label === "Begivenheder" && eventsLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-l8-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <motion.span>{count}</motion.span>
              {stat.suffix}
            </>
          )}
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.3 }}
          className="text-l8-beige"
        >
          {stat.label}
        </motion.div>
      </motion.div>
    );
  };

  // Map users to team members format
  const teamMembers = useMemo(() => {
    if (!users || users.length === 0) {
      return [];
    }
    
    return users
      .filter((user) => user.email !== 'danieljappe@icloud.com')
      .map((user) => {
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || user.email || 'Team Member';
        const initials = fullName
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        
        return {
          id: user.id,
          name: fullName,
          role: user.role || 'Team Member',
          image: user.imageUrl,
          initials,
          email: user.email,
          phoneNumber: user.phoneNumber,
        };
      });
  }, [users]);


  const stats = [
    { 
      icon: Users, 
      value: 4, 
      label: "Team Medlemmer", 
      suffix: "",
      duration: 1.5 + Math.random() * 1.5 // Random duration between 1.5 and 3 seconds
    },
    { 
      icon: Heart, 
      value: 1000, 
      label: "Glade gæster", 
      suffix: "+",
      duration: 1.5 + Math.random() * 1.5
    },
    { 
      icon: Rocket, 
      value: eventCount, 
      label: "Begivenheder", 
      suffix: "+",
      duration: 1.5 + Math.random() * 1.5
    },
    { 
      icon: Star, 
      value: 2, 
      label: "Års Erfaring", 
      suffix: "+",
      duration: 1.5 + Math.random() * 1.5
    }
  ];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={pageVariants}
      className="min-h-screen bg-gradient-to-b from-l8-dark to-l8-blue-dark text-white py-20 px-4 sm:px-6 lg:px-8"
    >
      {/* Hero Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="max-w-7xl mx-auto text-center mb-20 pt-12"
      >
        <motion.h1
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.8,
            type: "spring",
            stiffness: 100
          }}
          className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-l8-beige to-l8-blue"
        >
          Om Os
        </motion.h1>
        <motion.p
          variants={fadeIn}
          transition={{ delay: 0.3 }}
          className="text-xl text-l8-beige max-w-3xl mx-auto"
        >
          L8 kuraterer events med fokus på den nye bølge af dansk musik. Vi arbejder for at løfte og showcase artister i vækstlaget – og fungerer som bindeled mellem de nye talenter og de etablerede spillesteder. Siden vores første event i marts 2024 er vi vokset fra et lille festlokale i Sydhavnen til en scene på Distortion - og alt der i mellem. <br></br> Udforsk vores <Link to="/events" className="text-l8-blue hover:text-l8-blue-light transition-colors underline">kommende events</Link> eller <Link to="/booking" className="text-l8-blue hover:text-l8-blue-light transition-colors underline">book kunstnere</Link> til dit event.
        </motion.p>
      </motion.div>

      {/* Stats Section */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
      >
        {stats.map((stat, index) => (
          <StatCard key={index} stat={stat} index={index} />
        ))}
      </motion.div>

      {/* Team Section */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-7xl mx-auto"
      >
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-center mb-12"
        >
          Holdet bag L8
        </motion.h2>
        {(() => {
          if (usersLoading) {
            return (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-l8-blue border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-l8-beige text-sm">Indlæser team medlemmer...</p>
              </div>
            );
          }

          if (usersError) {
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center py-12"
              >
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md mx-auto">
                  <div className="flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-400 mb-2">
                    Fejl ved indlæsning af team medlemmer
                  </h3>
                  <p className="text-l8-beige text-sm mb-4 break-words">
                    {usersError}
                  </p>
                  <button
                    onClick={() => refetchUsers()}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-l8-blue hover:bg-l8-blue-light text-white rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Prøv igen</span>
                  </button>
                </div>
              </motion.div>
            );
          }

          if (!users || users.length === 0) {
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center py-12 text-l8-beige"
              >
                <p>Ingen brugere fundet.</p>
              </motion.div>
            );
          }

          if (teamMembers.length === 0) {
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center py-12 text-l8-beige"
              >
                <p>Ingen team medlemmer fundet (alle brugere kan være filtreret væk).</p>
                <p className="text-xs mt-2 text-l8-beige/60">
                  Antal brugere: {users.length}
                </p>
              </motion.div>
            );
          }

          return (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {teamMembers.map((member) => (
              <motion.div
                key={member.id}
                variants={fadeIn}
                whileHover={{ 
                  scale: 1.05,
                  transition: { type: "spring", stiffness: 400, damping: 10 }
                }}
                className="bg-black/30 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10"
              >
                <div className="relative w-full h-64 bg-gradient-to-br from-l8-blue/20 to-l8-beige/20 flex items-center justify-center overflow-hidden">
                  {member.image ? (
                    <motion.img
                      initial={{ scale: 1.2, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.6 }}
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.initials-fallback') as HTMLElement;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`initials-fallback w-full h-full flex items-center justify-center ${member.image ? 'hidden' : ''}`}>
                    <div className="w-24 h-24 bg-gradient-to-br from-l8-blue to-l8-blue-light rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-2xl font-bold">{member.initials}</span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <motion.h3
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl font-semibold mb-2 text-white"
                  >
                    {member.name}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-l8-beige text-sm font-medium mb-4"
                  >
                    {member.role}
                  </motion.p>
                  
                  {/* Contact Information */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    {member.email && (
                      <motion.a
                        href={`mailto:${member.email}`}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center space-x-2 text-l8-beige hover:text-l8-blue transition-colors text-xs"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{member.email}</span>
                      </motion.a>
                    )}
                    {member.phoneNumber && (
                      <motion.a
                        href={`tel:${member.phoneNumber}`}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center space-x-2 text-l8-beige hover:text-l8-blue transition-colors text-xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{member.phoneNumber}</span>
                      </motion.a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          );
        })()}
      </motion.div>

      {/* Contact CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-4xl mx-auto mt-20 text-center"
      >
        <div className="bg-gradient-to-r from-l8-blue/10 to-l8-beige/10 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-l8-beige to-l8-blue"
          >
            Ræk ud til os
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-l8-beige text-lg mb-8"
          >
            Vi brænder for at skabe og arbejde sammen med kulturskabere, ildsjæle, musikelskere, artister, brands og alt der imellem - alt i mens vi dygtiggører vores håndværk og forstørrer vores platform med et fokus på kvalitet, autenticitet og fællesskab som pejlemærket. <br/><br/> Har du et projekt, en release, et budskab eller noget helt fjerde som du tænker vi skal høre om? Så tøv ikke med et række ud!
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link
              to="/contact"
              className="inline-flex items-center px-8 py-4 rounded-xl bg-gradient-to-r from-l8-blue to-l8-blue-light text-white font-semibold text-lg hover:from-l8-blue-dark hover:to-l8-blue transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Kontakt Os
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Developer Credit Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-4xl mx-auto mt-20 text-center"
      >
        <div className="bg-gradient-to-r from-l8-blue/5 to-l8-beige/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center mb-4"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-l8-blue to-l8-blue-light rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-l8-beige to-l8-blue">
              Skabt med Kode
            </h3>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-l8-beige text-lg mb-6"
          >
            Denne hjemmeside blev designet og udviklet af Daniel Jappe Petersen i tæt samarbejde med L8 Events
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-4 text-sm text-l8-beige/80"
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Node.js & Typescript</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>PostgreSQL</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-l8-blue rounded-full"></div>
              <span>React & TypeScript</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
              <span>Tailwind CSS</span>
            </div>
          </motion.div>
          
          {/* Developer Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-6 pt-6 border-t border-white/10"
          >
            <p className="text-l8-beige/60 text-sm mb-4">
              Bygget med ❤️ for L8 Events fællesskabet
            </p>
            <div className="flex justify-center space-x-4">
              <motion.a
                href="https://www.linkedin.com/in/daniel-jappe-petersen-ab8649247/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 hover:text-blue-200 transition-all duration-300"
              >
                <Linkedin className="w-4 h-4" />
                <span className="text-sm font-medium">LinkedIn</span>
              </motion.a>
              <motion.a
                href="https://github.com/danieljappe"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 rounded-lg text-gray-300 hover:text-gray-200 transition-all duration-300"
              >
                <Github className="w-4 h-4" />
                <span className="text-sm font-medium">GitHub</span>
              </motion.a>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AboutUs; 