import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { apiService } from '../services/api';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const Contact = () => {
  const location = useLocation();
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [lastSubmitTime, setLastSubmitTime] = useState<number | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Scroll to top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Clear status message after 5 seconds
  useEffect(() => {
    if (submitStatus.type) {
      const timer = setTimeout(() => {
        setSubmitStatus({ type: null, message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitStatus]);

  // Cooldown timer to prevent rapid submissions
  useEffect(() => {
    if (lastSubmitTime && cooldownSeconds > 0) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - lastSubmitTime) / 1000);
        const remaining = Math.max(0, 60 - elapsed); // 60 second cooldown
        setCooldownSeconds(remaining);
        if (remaining === 0) {
          setLastSubmitTime(null);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lastSubmitTime, cooldownSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if in cooldown period
    if (cooldownSeconds > 0) {
      setSubmitStatus({
        type: 'error',
        message: `Vent venligst ${cooldownSeconds} sekunder før du sender igen.`
      });
      return;
    }

    // Client-side validation
    if (formData.message.length < 10) {
      setSubmitStatus({
        type: 'error',
        message: 'Beskeden skal være mindst 10 tegn lang.'
      });
      return;
    }

    if (formData.message.length > 5000) {
      setSubmitStatus({
        type: 'error',
        message: 'Beskeden må maksimalt være 5000 tegn lang.'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      // Submit contact form via API
      const result = await apiService.createContactMessage(formData);
      
      if (result.data) {
        // Reset form and show success message
        setFormData({ name: '', email: '', subject: '', message: '' });
        setSubmitStatus({
          type: 'success',
          message: 'Tak for din besked! Vi vender tilbage hurtigst muligt.'
        });
        // Set cooldown period (60 seconds)
        setLastSubmitTime(Date.now());
        setCooldownSeconds(60);
      } else {
        // Check if it's a rate limit error
        if (result.error?.includes('Too many') || result.error?.includes('wait')) {
          setSubmitStatus({
            type: 'error',
            message: 'For mange indsendelser. Vent venligst 15 minutter før du prøver igen.'
          });
          setLastSubmitTime(Date.now());
          setCooldownSeconds(60);
        } else {
          setSubmitStatus({
            type: 'error',
            message: result.error || 'Der opstod en fejl ved afsendelse af din besked. Prøv venligst igen.'
          });
        }
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Der opstod en fejl ved afsendelse af din besked. Prøv venligst igen.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="max-w-7xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="text-center mb-16"
          variants={itemVariants}
        >
          <h1 className="text-4xl font-bold text-white mb-4">Kontakt Os</h1>
          <p className="text-xl text-white/80">
          Har du et projekt, en release, et budskab eller noget helt fjerde som du tænker vi skal høre om? Så tøv ikke med et række ud!
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Contact Information */}
          <motion.div 
            className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20"
            variants={itemVariants}
          >
            <h2 className="text-2xl font-semibold text-white mb-8">Kom i Kontakt</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Mail className="w-6 h-6 text-l8-blue flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-medium text-white">E-mail</h3>
                  <p className="mt-2 text-white/80">kontaktl8@outlook.dk</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Phone className="w-6 h-6 text-l8-blue flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-medium text-white">Telefon</h3>
                  <p className="mt-2 text-white/80">+45 50 52 22 93 (Mikkel Mourier)</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Clock className="w-6 h-6 text-l8-blue flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-medium text-white">Åbningstider</h3>
                  <p className="mt-2 text-white/80">
                    Aldrig lukket. Aldrig L8
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20"
            variants={itemVariants}
          >
            {/* Status Messages */}
            {submitStatus.type && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-6 p-4 rounded-xl flex items-start space-x-3 ${
                  submitStatus.type === 'success'
                    ? 'bg-green-500/20 border border-green-500/30'
                    : 'bg-red-500/20 border border-red-500/30'
                }`}
              >
                {submitStatus.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-sm ${
                    submitStatus.type === 'success' ? 'text-green-300' : 'text-red-300'
                  }`}
                >
                  {submitStatus.message}
                </p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white">
                  Navn
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 block w-full rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-l8-blue focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Dit navn"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white">
                  E-mail
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 block w-full rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-l8-blue focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="din.email@eksempel.dk"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-white">
                  Emne
                </label>
                <input
                  type="text"
                  name="subject"
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 block w-full rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-l8-blue focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Hvad handler dette om?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-white">
                  Besked
                </label>
                <textarea
                  name="message"
                  id="message"
                  rows={4}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 block w-full rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-l8-blue focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Din besked her..."
                />
              </div>

              <motion.div
                whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              >
                <button
                  type="submit"
                  disabled={isSubmitting || cooldownSeconds > 0}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-l8-blue to-l8-blue-light hover:from-l8-blue-dark hover:to-l8-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-l8-blue transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sender...
                    </>
                  ) : cooldownSeconds > 0 ? (
                    `Vent ${cooldownSeconds}s før næste indsendelse`
                  ) : (
                    'Send Besked'
                  )}
                </button>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Contact; 