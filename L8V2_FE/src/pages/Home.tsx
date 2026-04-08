import React, { useRef, useEffect, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionValueEvent,
  type MotionValue,
} from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, ArrowRight, Info, ChevronDown, MapPin, Music2 } from 'lucide-react';
import { type Event } from '../services/api';
import { slugify } from '../utils/slugUtils';
import UpcomingEvent from '../components/UpcomingEvent';
import PreviousEventGallery from '../components/PreviousEventGallery';
import SocialMediaSection from '../components/SocialMediaSection';
import { useSEO } from '../hooks/useSEO';
import { StructuredData, createOrganizationSchema, createWebSiteSchema } from '../components/StructuredData';
import { useStats, useUpcomingEvents } from '../hooks/useApi';

// ─── Scroll-triggered fade-up wrapper ────────────────────────────────────────
const FadeUp: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children,
  delay = 0,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px 0px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 48 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─── Stagger variants ─────────────────────────────────────────────────────────
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  },
};

// ─── Animated counter ─────────────────────────────────────────────────────────
const Counter: React.FC<{ to: number; suffix?: string }> = ({ to, suffix = '' }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let startTs: number | null = null;
    const duration = 1800;
    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const progress = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(to * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, to]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
};

// ─── Infinite horizontal marquee ──────────────────────────────────────────────
const MARQUEE_ITEMS = [
  'L8 Events',
  'Den Nye Bølge',
  'Dansk Musik',
  'Live Oplevelser',
  'Artist Booking',
  'Musik Events',
];

const Marquee: React.FC = () => {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="overflow-hidden py-5 border-y border-white/10">
      <motion.div
        className="flex whitespace-nowrap w-max"
        initial={{ x: 0 }}
        animate={{ x: '-50%' }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="text-white/30 text-[10px] tracking-[0.45em] uppercase shrink-0 px-8"
          >
            {item}
            <span className="text-l8-blue ml-8">•</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
};

// ─── Ambient pulsing orb ──────────────────────────────────────────────────────
interface OrbProps {
  x: string;
  y: string;
  size: number;
  color: string;
  opacity?: number;
  delay?: number;
}

const Orb: React.FC<OrbProps> = ({ x, y, size, color, opacity = 0.4, delay = 0 }) => (
  <div
    className="absolute rounded-full pointer-events-none"
    style={{
      left: x,
      top: y,
      width: size,
      height: size,
      background: color,
      filter: `blur(${Math.round(size * 0.38)}px)`,
      opacity,
      transform: 'translate(-50%, -50%)',
    }}
  >
    <motion.div
      className="w-full h-full rounded-full"
      animate={{ scale: [1, 1.14, 1] }}
      transition={{ duration: 7 + delay * 1.5, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  </div>
);

// ─── Glowing section divider ──────────────────────────────────────────────────
const Divider: React.FC = () => (
  <FadeUp className="max-w-5xl mx-auto px-6 py-2">
    <div className="h-px bg-gradient-to-r from-transparent via-l8-blue/20 to-transparent" />
  </FadeUp>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  HERO EVENT PROMO WIDGET
// ═══════════════════════════════════════════════════════════════════════════════
const HeroEventWidget: React.FC<{ event: Event; scrollOpacity: MotionValue<number> }> = ({
  event,
  scrollOpacity,
}) => {
  const navigate = useNavigate();
  const [daysUntil, setDaysUntil] = useState(0);

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const target = new Date(event.date);
      now.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);
      setDaysUntil(Math.max(0, Math.round((target.getTime() - now.getTime()) / 86_400_000)));
    };
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, [event.date]);

  const artists   = event.eventArtists ?? [];
  const _soldPct  = event.totalTickets > 0
    ? Math.min((event.soldTickets / event.totalTickets) * 100, 100)
    : 0;
  const _remaining = event.totalTickets - event.soldTickets;
  const isToday   = daysUntil === 0;

  return (
    // Outer: fades out as user scrolls past hero
    <motion.div
      style={{ opacity: scrollOpacity }}
      className="absolute bottom-10 left-6 sm:left-10 z-20 pointer-events-auto"
    >
      {/* Inner: entry animation */}
      <motion.div
        initial={{ opacity: 0, y: 28, x: -16 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ delay: 1.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(`/events/${slugify(event.title)}`)}
          className="cursor-pointer w-72 sm:w-80 rounded-2xl border border-l8-blue/20
            bg-white/[0.055] backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden"
        >
          {/* Subtle top accent line */}
          <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-l8-blue/60 to-transparent" />

          <div className="p-4 sm:p-5">
            {/* ── Row 1: badge · countdown ─────────────────────── */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-[9px] tracking-[0.3em] uppercase text-l8-blue font-medium">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-l8-blue block shrink-0"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                Næste Event
              </div>

              {/* Countdown chip */}
              <motion.div
                animate={isToday ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 1.2, repeat: Infinity }}
                className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide border
                  ${isToday
                    ? 'bg-l8-blue/20 border-l8-blue/40 text-l8-blue'
                    : 'bg-white/[0.06] border-white/10 text-white/50'
                  }`}
              >
                {isToday ? 'I DAG' : `om ${daysUntil} dag${daysUntil !== 1 ? 'e' : ''}`}
              </motion.div>
            </div>

            {/* ── Row 2: title ─────────────────────────────────── */}
            <h3 className="font-bold text-white text-[15px] leading-snug mb-1 line-clamp-1">
              {event.title}
            </h3>

            {/* ── Row 3: venue · time ──────────────────────────── */}
            <p className="text-white/40 text-[11px] flex items-center gap-1 mb-4">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{event.venue?.name ?? 'TBA'}</span>
              {event.startTime && (
                <>
                  <span className="text-white/20 mx-0.5">·</span>
                  <span className="shrink-0">{event.startTime}</span>
                </>
              )}
            </p>

            {/* ── Row 4: artist avatars · ticket bar ───────────── */}
            <div className="flex items-end justify-between gap-3">
              {/* Stacked avatars */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {artists.slice(0, 4).map((ea, i) => (
                    <div
                      key={ea.artist?.id ?? i}
                      className="w-7 h-7 rounded-full border-2 border-[#050505] overflow-hidden bg-l8-blue/20 shrink-0"
                      style={{ zIndex: 10 - i }}
                    >
                      {ea.artist?.imageUrl
                        ? <img src={ea.artist.imageUrl} alt={ea.artist.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-[8px] text-white/60 font-bold">
                            {ea.artist?.name?.[0] ?? <Music2 className="w-3 h-3 text-white/40" />}
                          </div>
                      }
                    </div>
                  ))}
                  {artists.length > 4 && (
                    <div className="w-7 h-7 rounded-full border-2 border-[#050505] bg-white/10 flex items-center justify-center text-[9px] text-white/50 font-medium shrink-0">
                      +{artists.length - 4}
                    </div>
                  )}
                </div>
                {artists.length > 0 && (
                  <span className="text-[10px] text-white/30">{artists.length} kunstner{artists.length !== 1 ? 'e' : ''}</span>
                )}
              </div>
            </div>

            {/* ── Row 5: date · arrow ──────────────────────────── */}
            <div className="mt-3.5 pt-3 border-t border-white/[0.07] flex items-center justify-between">
              <span className="text-[11px] text-white/35 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {new Date(event.date).toLocaleDateString('da-DK', { day: 'numeric', month: 'long' })}
              </span>
              <motion.span whileHover={{ x: 3 }} className="text-l8-blue">
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  APPLE-STYLE PINNED SCROLL SHOWCASE
// ═══════════════════════════════════════════════════════════════════════════════
const PinnedShowcase: React.FC = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { data: stats } = useStats();

  const eventCount        = stats?.eventCount        ?? 0;
  const artistCount       = stats?.bookableArtistCount ?? 0;
  const genreCount        = stats?.genreCount        ?? 0;
  const venueCount        = stats?.venueCount        ?? 0;
  const totalEventArtists = stats?.totalEventArtists ?? 0;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Drag-constraint ref for photo collage
  const collageRef = useRef<HTMLDivElement>(null);

  // ── Slide opacity & y (each slide enters from below, exits upward) ───────────
  // Slide 1: active 0 → 0.33
  const s1Opacity = useTransform(scrollYProgress, [0, 0.07, 0.26, 0.33], [0, 1, 1, 0]);
  const s1Y       = useTransform(scrollYProgress, [0, 0.07, 0.26, 0.33], [28, 0, 0, -28]);

  // Slide 2: active 0.33 → 0.66
  const s2Opacity = useTransform(scrollYProgress, [0.26, 0.33, 0.59, 0.66], [0, 1, 1, 0]);
  const s2Y       = useTransform(scrollYProgress, [0.26, 0.33, 0.59, 0.66], [28, 0, 0, -28]);

  // Slide 3: active 0.66 → 1.0
  const s3Opacity = useTransform(scrollYProgress, [0.59, 0.66, 0.93, 1.0], [0, 1, 1, 0]);
  const s3Y       = useTransform(scrollYProgress, [0.59, 0.66, 0.93, 1.0], [28, 0, 0, -28]);

  // ── Progress dot opacities ────────────────────────────────────────────────────
  const dot1Op = useTransform(scrollYProgress, [0, 0.30, 0.33], [1, 1, 0.2]);
  const dot2Op = useTransform(scrollYProgress, [0.30, 0.33, 0.63, 0.66], [0.2, 1, 1, 0.2]);
  const dot3Op = useTransform(scrollYProgress, [0.63, 0.66, 1], [0.2, 1, 1]);

  // ── Background glow per slide ─────────────────────────────────────────────────
  const bg1Op = useTransform(scrollYProgress, [0, 0.26, 0.33], [1, 1, 0]);
  const bg2Op = useTransform(scrollYProgress, [0.26, 0.33, 0.59, 0.66], [0, 1, 1, 0]);
  const bg3Op = useTransform(scrollYProgress, [0.59, 0.66, 1], [0, 1, 1]);

  // ── Pointer events: disable invisible slides so they don't eat clicks ────────
  const s1Ptr = useTransform(s1Opacity, (v: number) => v > 0.05 ? 'auto' : 'none');
  const s2Ptr = useTransform(s2Opacity, (v: number) => v > 0.05 ? 'auto' : 'none');
  const s3Ptr = useTransform(s3Opacity, (v: number) => v > 0.05 ? 'auto' : 'none');

  // ── Per-photo stagger y — derived from container y (multiply, no new scrollYProgress subscription) ─
  const s1p2Y = useTransform(s1Y, (v: number) => v * 1.5);
  const s1p3Y = useTransform(s1Y, (v: number) => v * 2.0);
  const s2p2Y = useTransform(s2Y, (v: number) => v * 1.5);
  const s2p3Y = useTransform(s2Y, (v: number) => v * 2.0);

  // ── Per-slide scale — derived from opacity (0 opacity = 0.88 scale, fully visible = 1.0) ─────────
  const s1Scale = useTransform(s1Opacity, (v: number) => 0.88 + v * 0.12);
  const s2Scale = useTransform(s2Opacity, (v: number) => 0.88 + v * 0.12);
  const s3Scale = useTransform(s3Opacity, (v: number) => 0.88 + v * 0.12);

  // ── Lazy-mount photos: only render a slide's photos when that slide is visible ─
  // This cuts active GPU compositing layers from 9 → 3 (or 6 during cross-fade)
  const [s1Active, setS1Active] = useState(() => s1Opacity.get() > 0.01);
  const [s2Active, setS2Active] = useState(() => s2Opacity.get() > 0.01);
  const [s3Active, setS3Active] = useState(() => s3Opacity.get() > 0.01);
  useMotionValueEvent(s1Opacity, 'change', (v) => setS1Active(v > 0.01));
  useMotionValueEvent(s2Opacity, 'change', (v) => setS2Active(v > 0.01));
  useMotionValueEvent(s3Opacity, 'change', (v) => setS3Active(v > 0.01));

  return (
    <div ref={sectionRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">

        {/* Per-slide background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div className="absolute inset-0" style={{ opacity: bg1Op,
            background: 'radial-gradient(ellipse 55% 65% at 68% 50%, rgba(0,192,255,0.07) 0%, transparent 68%)' }} />
          <motion.div className="absolute inset-0" style={{ opacity: bg2Op,
            background: 'radial-gradient(ellipse 55% 65% at 68% 50%, rgba(249,223,199,0.055) 0%, transparent 68%)' }} />
          <motion.div className="absolute inset-0" style={{ opacity: bg3Op,
            background: 'radial-gradient(ellipse 55% 65% at 68% 50%, rgba(51,204,255,0.07) 0%, transparent 68%)' }} />
        </div>

        <div className="container mx-auto max-w-6xl px-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">

            {/* ── Text slides ──────────────────────────────────────────────── */}
            <div className="relative h-72 sm:h-80 md:h-[22rem] order-2 md:order-1">

              {/* Slide 1 — Begivenheder */}
              <motion.div style={{ opacity: s1Opacity, y: s1Y, pointerEvents: s1Ptr }}
                className="absolute inset-0 flex flex-col justify-center">
                <p className="text-white/30 text-[10px] tracking-[0.45em] uppercase mb-4">
                  01 — Begivenheder
                </p>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.05] mb-4">
                  Oplevelser<br />
                  <span className="text-l8-blue">der Mærkes</span>
                </h2>
                <p className="text-white/50 text-sm sm:text-base leading-relaxed max-w-sm mb-6">
                  Fra intime scener til pulserende publikummer — vi afholder begivenheder der efterlader et aftryk og bringer folk tættere på musikken.
                </p>
                <motion.button
                  onClick={() => navigate('/events')}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="inline-flex items-center gap-2 self-start px-5 py-2.5 rounded-full
                    border border-l8-blue/30 bg-l8-blue/10 text-l8-blue text-sm
                    hover:bg-l8-blue/20 transition-colors"
                >
                  Udforsk Begivenheder <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </motion.div>

              {/* Slide 2 — Booking */}
              <motion.div style={{ opacity: s2Opacity, y: s2Y, pointerEvents: s2Ptr }}
                className="absolute inset-0 flex flex-col justify-center">
                <p className="text-white/30 text-[10px] tracking-[0.45em] uppercase mb-4">
                  02 — Booking
                </p>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.05] mb-4">
                  Find Din<br />
                  <span className="text-l8-beige">Næste Artist</span>
                </h2>
                <p className="text-white/50 text-sm sm:text-base leading-relaxed max-w-sm mb-6">
                  Book spirrende danske artister til dit næste event. Vi forbinder dig direkte med vækstlagets stemmer.
                </p>
                <motion.button
                  onClick={() => navigate('/booking')}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="inline-flex items-center gap-2 self-start px-5 py-2.5 rounded-full
                    border border-l8-beige/30 bg-l8-beige/10 text-l8-beige text-sm
                    hover:bg-l8-beige/20 transition-colors"
                >
                  Book Kunstnere <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </motion.div>

              {/* Slide 3 — Om Os */}
              <motion.div style={{ opacity: s3Opacity, y: s3Y, pointerEvents: s3Ptr }}
                className="absolute inset-0 flex flex-col justify-center">
                <p className="text-white/30 text-[10px] tracking-[0.45em] uppercase mb-4">
                  03 — Om Os
                </p>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.05] mb-4">
                  Hvem<br />
                  <span className="text-l8-blue-light">Er Vi?</span>
                </h2>
                <p className="text-white/50 text-sm sm:text-base leading-relaxed max-w-sm mb-6">
                  L8 Events er broen mellem nye talenter og etablerede scener. Vi skaber rum for musikken og menneskene bag den.
                </p>
                <motion.button
                  onClick={() => navigate('/about')}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="inline-flex items-center gap-2 self-start px-5 py-2.5 rounded-full
                    border border-l8-blue-light/30 bg-l8-blue-light/10 text-l8-blue-light text-sm
                    hover:bg-l8-blue-light/20 transition-colors"
                >
                  Læs Mere <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </motion.div>
            </div>

            {/* ── Photo collage ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-center order-1 md:order-2 h-72 sm:h-80 md:h-[22rem]">
              <div ref={collageRef} className="relative w-full h-full select-none">

                {([
                  {
                    slideOpacity: s1Opacity, slidePtr: s1Ptr, slideScale: s1Scale, slideActive: s1Active,
                    photos: [
                      { src: 'https://l8events.dk/uploads/gallery/image-1765282582367-411010143.jpg', pos: { top: '10%', left: '0%',  width: '60%' }, rotate: -6, z: 1, yMV: s1Y   },
                      { src: 'https://l8events.dk/uploads/gallery/image-1763652178542-895823745.jpg', pos: { top: '0%',  right: '2%', width: '38%' }, rotate:  8, z: 2, yMV: s1p2Y },
                      { src: 'https://l8events.dk/uploads/gallery/image-1763651503011-791559750.jpg', pos: { bottom: '0%', right: '0%', width: '50%' }, rotate: -4, z: 3, yMV: s1p3Y },
                    ],
                  },
                  {
                    slideOpacity: s2Opacity, slidePtr: s2Ptr, slideScale: s2Scale, slideActive: s2Active,
                    photos: [
                      { src: 'https://l8events.dk/uploads/gallery/image-1763650597555-58480668.jpg',  pos: { top: '8%',    left: '4%',  width: '58%' }, rotate: -5, z: 1, yMV: s2Y   },
                      { src: 'https://l8events.dk/uploads/gallery/image-1765280169143-317406417.jpg', pos: { top: '0%',    right: '0%', width: '40%' }, rotate:  9, z: 2, yMV: s2p2Y },
                      { src: 'https://l8events.dk/uploads/gallery/image-1763650616959-163146487.jpg', pos: { bottom: '2%', left: '16%', width: '52%' }, rotate: -3, z: 3, yMV: s2p3Y },
                    ],
                  },
                  {
                    slideOpacity: s3Opacity, slidePtr: s3Ptr, slideScale: s3Scale, slideActive: s3Active,
                    photos: [
                      { src: 'https://l8events.dk/uploads/gallery/image-1765280815686-895715630.png', pos: { top: '10%', left: '10%', width: '80%' }, rotate: -3, z: 1, yMV: s3Y },
                    ],
                  },
                ] as {
                  slideOpacity:  ReturnType<typeof useTransform>;
                  slidePtr:      ReturnType<typeof useTransform>;
                  slideScale:    ReturnType<typeof useTransform>;
                  slideActive:   boolean;
                  photos: { src: string; pos: Record<string, string>; rotate: number; z: number; yMV: ReturnType<typeof useTransform> }[];
                }[]).map(({ slideOpacity, slidePtr, slideScale, slideActive, photos }) => (
                  <motion.div
                    key={photos[0].src + photos[0].rotate}
                    style={{ opacity: slideOpacity, scale: slideScale, pointerEvents: slidePtr }}
                    className="absolute inset-0"
                  >
                    {slideActive && photos.map(({ src, pos, rotate, z, yMV }, idx) => (
                      <motion.div
                        key={idx}
                        drag
                        dragConstraints={collageRef}
                        dragElastic={0.1}
                        dragMomentum={false}
                        whileHover={{ rotate: 0, scale: 1.06, zIndex: 20 }}
                        whileDrag={{ scale: 1.08, zIndex: 50 }}
                        className="absolute cursor-grab active:cursor-grabbing overflow-hidden rounded-xl shadow-md"
                        style={{ ...pos, zIndex: z, aspectRatio: '4/3', y: yMV, rotate }}
                      >
                        <img src={src} alt="" className="w-full h-full object-cover pointer-events-none" draggable={false} />
                      </motion.div>
                    ))}
                  </motion.div>
                ))}

              </div>
            </div>
          </div>

          {/* ── Stats — cross-fade per slide ─────────────────────────────── */}
          <div className="relative mt-8 pt-7 border-t border-white/[0.06] h-28 sm:h-14">
            {([
              {
                opacity: s1Opacity,
                color: 'text-l8-blue',
                stats: [
                  { value: eventCount,       suffix: '+', label: 'Events Afholdt'  },
                  { value: totalEventArtists, suffix: '',  label: 'Optrædenere'     },
                  { value: venueCount,        suffix: '',  label: 'Spillesteder'    },
                  { value: 1000,              suffix: '+', label: 'Gæster Samlet'   },
                ],
              },
              {
                opacity: s2Opacity,
                color: 'text-l8-beige',
                stats: [
                  { value: artistCount, suffix: '',   label: 'Bookbare Kunstnere' },
                  { value: genreCount,  suffix: '',   label: 'Genrer'             },
                  { value: eventCount,  suffix: '+',  label: 'Events Booket'      },
                  { value: 24,          suffix: '/7', label: 'Support'            },
                ],
              },
              {
                opacity: s3Opacity,
                color: 'text-l8-blue-light',
                stats: [
                  { value: 4,          suffix: '',  label: 'Team Medlemmer' },
                  { value: 2,          suffix: '+', label: 'Års Erfaring'   },
                  { value: 1000,       suffix: '+', label: 'Glade Gæster'   },
                  { value: eventCount, suffix: '+', label: 'Begivenheder'   },
                ],
              },
            ]).map(({ opacity, color, stats }) => (
              <motion.div
                key={color}
                style={{ opacity }}
                className="absolute inset-0 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-center"
              >
                {stats.map(({ value, suffix, label }) => (
                  <div key={label}>
                    <div className={`text-2xl sm:text-3xl font-bold ${color}`}>
                      <Counter to={value} suffix={suffix} />
                    </div>
                    <p className="text-white/35 text-[9px] tracking-[0.28em] uppercase mt-0.5">{label}</p>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>

          {/* ── Slide progress indicators ─────────────────────────────────── */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <motion.div style={{ opacity: dot1Op }} className="w-8 h-0.5 rounded-full bg-l8-blue" />
            <motion.div style={{ opacity: dot2Op }} className="w-8 h-0.5 rounded-full bg-l8-blue" />
            <motion.div style={{ opacity: dot3Op }} className="w-8 h-0.5 rounded-full bg-l8-blue" />
          </div>
        </div>

      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  HOME
// ═══════════════════════════════════════════════════════════════════════════════
const Home: React.FC = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);

  const { data: upcomingEvents } = useUpcomingEvents(1);
  const upcomingEvent = upcomingEvents?.[0] ?? null;

  // Global scroll progress → top progress bar
  const { scrollYProgress } = useScroll();
  const progressScaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // Hero scroll-linked transforms
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroOpacity       = useTransform(heroProgress, [0, 0.75], [1, 0]);
  const heroScale         = useTransform(heroProgress, [0, 1],    [1, 0.92]);
  const heroContentY      = useTransform(heroProgress, [0, 1],    ['0%', '-18%']);
  const orb1Y             = useTransform(heroProgress, [0, 1],    ['0px', '-130px']);
  const orb2Y             = useTransform(heroProgress, [0, 1],    ['0px', '-70px']);
  const scrollIndicatorOp = useTransform(heroProgress, [0, 0.18], [1, 0]);

  useSEO({
    title: 'L8 Events - Den Nye Bølge af Dansk Musik',
    description:
      'L8 Events kuraterer events med fokus på den nye bølge af dansk musik. Book spirrende artister, deltag i vores begivenheder, og oplev uforglemmelige musikkopplevelser. Vi fungerer som bindeled mellem nye talenter og etablerede spillesteder.',
    keywords:
      'L8 Events, dansk musik, elektronisk musik, event booking, kunstnere booking, musikkopplevelser, vækstlaget musik, DJ events, musik events Danmark, event management, booking service',
    url: '/',
  });

  return (
    <div className="min-h-screen overflow-x-clip">
      <StructuredData data={createOrganizationSchema()} />
      <StructuredData data={createWebSiteSchema()} />

      {/* ── Scroll progress bar ──────────────────────────────────────────── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-l8-blue to-l8-blue-light z-50 origin-left"
        style={{ scaleX: progressScaleX }}
      />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  HERO                                                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative h-screen flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Ambient orbs with independent parallax */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div className="absolute inset-0" style={{ y: orb1Y }}>
            <Orb x="22%" y="32%" size={480} color="#00c0ff" opacity={0.07} delay={0} />
          </motion.div>
          <motion.div className="absolute inset-0" style={{ y: orb2Y }}>
            <Orb x="78%" y="62%" size={400} color="#0099cc" opacity={0.055} delay={2.5} />
          </motion.div>
          <Orb x="50%" y="85%" size={300} color="#f9dfc7" opacity={0.035} delay={5} />
        </div>

        {/* Dot-grid overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }} />

        {/* Vignette so grid fades at edges */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, #050505 100%)' }} />

        {/* Hero content – parallax upward on scroll */}
        <motion.div
          style={{ y: heroContentY, opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 text-center px-6"
        >
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2.5 mb-10 px-5 py-2 rounded-full
              border border-l8-blue/25 bg-l8-blue/10 text-l8-blue text-[10px] tracking-[0.35em] uppercase"
          >
            <motion.span className="w-1.5 h-1.5 rounded-full bg-l8-blue"
              animate={{ opacity: [1, 0.25, 1] }}
              transition={{ duration: 2, repeat: Infinity }} />
            Events Platform
          </motion.div>

          {/* Giant "L8" — letterSpacing animates on entrance */}
          <motion.h1
            initial={{ opacity: 0, y: 50, letterSpacing: '0.25em' }}
            animate={{ opacity: 1, y: 0, letterSpacing: '-0.02em' }}
            transition={{ duration: 1.05, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-[7rem] sm:text-[9rem] md:text-[13rem] font-bold leading-none text-white"
          >
            L8
          </motion.h1>

          {/* "Events" */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl sm:text-2xl md:text-4xl font-light tracking-[0.38em] text-l8-beige uppercase mb-8"
          >
            Events
          </motion.p>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.58, duration: 0.9 }}
            className="text-white/45 text-sm sm:text-base tracking-wide mb-12 max-w-sm mx-auto"
          >
            Den nye bølge af dansk musik
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.82, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: '0 0 32px rgba(0,192,255,0.38)' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/events')}
              className="flex items-center gap-3 px-8 py-3.5 bg-l8-blue text-l8-dark
                font-semibold rounded-full text-sm tracking-wide shadow-lg shadow-l8-blue/20"
            >
              Udforsk Events <ArrowRight className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.06, backgroundColor: 'rgba(255,255,255,0.06)' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/booking')}
              className="flex items-center gap-3 px-8 py-3.5 border border-white/20
                text-white/75 font-medium rounded-full text-sm tracking-wide transition-colors"
            >
              Book Kunstnere
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Upcoming event hero widget */}
        {upcomingEvent && (
          <HeroEventWidget event={upcomingEvent} scrollOpacity={heroOpacity} />
        )}

        {/* Scroll indicator */}
        <motion.div
          style={{ opacity: scrollIndicatorOp }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center
            gap-2 text-white/35 text-[10px] tracking-[0.45em] uppercase pointer-events-none"
        >
          <span>Scroll</span>
          <motion.div animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Marquee ──────────────────────────────────────────────────────── */}
      <Marquee />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  UPCOMING EVENT  (second section)                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <FadeUp>
        <UpcomingEvent />
      </FadeUp>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  APPLE-STYLE PINNED SCROLL SHOWCASE                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <PinnedShowcase />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  SOCIAL MEDIA                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Divider />
      <FadeUp delay={0.05}>
        <SocialMediaSection />
      </FadeUp>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  PREVIOUS EVENT GALLERY                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Divider />
      <FadeUp delay={0.05}>
        <PreviousEventGallery />
      </FadeUp>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  NAVIGATION CARDS                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-4">
        <div className="container mx-auto max-w-6xl">

          <FadeUp className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Udforsk mere
            </h2>
          </FadeUp>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
          >
            {[
              {
                icon: Calendar,
                iconColor: 'text-l8-blue',    iconBg: 'bg-l8-blue/10',
                accentColor: 'text-l8-blue',   borderColor: 'border-l8-blue/15',
                glowShadow: '0 8px 40px rgba(0,192,255,0.12)',
                title: 'Begivenheder',
                desc:  'Opdag vores kommende begivenheder eller se highlights fra tidligere events.',
                cta:   'Udforsk Begivenheder',
                route: '/events',
              },
              {
                icon: Users,
                iconColor: 'text-l8-beige',   iconBg: 'bg-l8-beige/10',
                accentColor: 'text-l8-beige',  borderColor: 'border-l8-beige/15',
                glowShadow: '0 8px 40px rgba(249,223,199,0.08)',
                title: 'Booking',
                desc:  'Book talentfulde artister til dine events og skab uforglemmelige oplevelser.',
                cta:   'Book Kunstnere',
                route: '/booking',
              },
              {
                icon: Info,
                iconColor: 'text-white/65',   iconBg: 'bg-white/10',
                accentColor: 'text-white/65',  borderColor: 'border-white/10',
                glowShadow: '0 8px 40px rgba(255,255,255,0.04)',
                title: 'Om Os',
                desc:  'Lær mere om L8 Events og vores mission om at skabe uforglemmelige musikoplevelser.',
                cta:   'Læs Mere',
                route: '/about',
              },
            ].map(({ icon: Icon, iconColor, iconBg, accentColor, borderColor, glowShadow, title, desc, cta, route }) => (
              <motion.div
                key={title}
                variants={staggerItem}
                whileHover={{ y: -10, boxShadow: glowShadow }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 270, damping: 20 }}
                onClick={() => navigate(route)}
                className={`group cursor-pointer rounded-3xl border ${borderColor}
                  bg-white/[0.04] backdrop-blur-xl p-8 flex flex-col h-72
                  hover:bg-white/[0.07] transition-colors duration-300`}
              >
                <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center mb-6 shrink-0`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-white/50 flex-grow text-sm leading-relaxed">{desc}</p>
                <div className={`flex items-center gap-2 ${accentColor} text-sm mt-4`}>
                  <span>{cta}</span>
                  <motion.div className="group-hover:translate-x-1.5 transition-transform duration-200">
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
