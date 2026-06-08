import React, { useRef } from 'react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
} from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Music, Ticket, X,
  AlertCircle, Camera, ChevronDown, ExternalLink,
} from 'lucide-react';
import ArtistModal from '../components/ArtistModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useEvent } from '../hooks/useApi';
import type { Artist } from '../services/api';
import type { TimelineItem } from '../types/admin';
import { constructFullUrl } from '../utils/imageUtils';
import VenueMapEmbed from '../components/VenueMapEmbed';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function computeEffectiveTimes(items: TimelineItem[]): (string | null)[] {
  const result: (string | null)[] = [];
  let lastEnd: number | null = null;
  for (const item of items) {
    if (item.startTime) {
      result.push(item.startTime);
      lastEnd = item.durationMinutes != null
        ? timeToMinutes(item.startTime) + item.durationMinutes
        : null;
    } else if (lastEnd !== null) {
      result.push(minutesToTime(lastEnd));
      lastEnd = item.durationMinutes != null ? lastEnd + item.durationMinutes : null;
    } else {
      result.push(null);
      lastEnd = null;
    }
  }
  return result;
}

const TYPE_META: Record<string, { label: string; bg: string; color: string }> = {
  artist_set: { label: 'Artist',  bg: 'rgba(0,192,255,0.14)',   color: '#00c0ff'                  },
  dj_set:     { label: 'DJ Set',  bg: 'rgba(160,80,255,0.14)',  color: '#a050ff'                  },
  break:      { label: 'Pause',   bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.38)'   },
  talk:       { label: 'Talk',    bg: 'rgba(20,200,180,0.12)',  color: '#14c8b4'                  },
  custom:     { label: 'Andet',   bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.38)'   },
  collab_set: { label: 'Collab',  bg: 'rgba(255,140,0,0.14)',   color: '#ff8c00'                  },
};


// ─── FadeUp helper ────────────────────────────────────────────────────────────

const FadeUp: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px 0px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

// ─── Section label ────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[10px] tracking-[0.45em] uppercase text-white/30 mb-3">{children}</p>
);

// ─── Ticket widget (desktop sidebar) ─────────────────────────────────────────

interface TicketWidgetProps {
  billettoLink: string;
  billettoData?: { maxCapacity: number | null; ticketsAvailable: number | null; lastSyncedAt: string; availabilityLabel?: string | null };
  isUpcoming: boolean;
  title: string;
}

const TicketWidget: React.FC<TicketWidgetProps> = ({ billettoLink, billettoData, isUpcoming, title }) => {
  const label = billettoData?.availabilityLabel ?? null;
  const { ticketsAvailable, maxCapacity } = billettoData ?? {};

  return (
    <div className="rounded-2xl border border-l8-blue/20 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
      <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-l8-blue/50 to-transparent" />
      <div className="p-6">
        <SectionLabel>Billetter</SectionLabel>
        <p className="text-white font-semibold text-base mb-5 line-clamp-2 leading-snug">{title}</p>

        {isUpcoming ? (
          <>
            {label === 'Udsolgt' && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-400/20">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                <span className="text-red-300 text-sm font-medium">Udsolgt</span>
              </div>
            )}
            {(label === 'Sidste billetter' || label === 'Få billetter tilbage') && ticketsAvailable != null && (
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-400/20">
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-amber-400 shrink-0"
                  />
                  <span className="text-amber-300 text-sm font-medium">
                    {ticketsAvailable} billetter tilbage
                  </span>
                </div>
                {maxCapacity != null && (
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-400 h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min((ticketsAvailable / maxCapacity) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )}
            {label === 'Billetter til salg' && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-green-500/10 border border-green-400/20">
                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <span className="text-green-300 text-sm font-medium">Billetter tilgængelige</span>
              </div>
            )}

            {label === 'Udsolgt' ? (
              <div className="w-full py-3.5 rounded-xl bg-white/5 text-white/30 font-semibold text-sm text-center">
                Udsolgt
              </div>
            ) : (
              <motion.a
                href={billettoLink}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03, boxShadow: '0 0 28px rgba(0,192,255,0.3)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl
                  bg-l8-blue text-l8-dark font-bold text-sm tracking-wide"
              >
                <Ticket className="w-4 h-4" />
                Køb Billetter
                <ExternalLink className="w-3 h-3 opacity-60" />
              </motion.a>
            )}
            <p className="text-white/25 text-[11px] text-center mt-3">Via Billetto — sikker betaling</p>
          </>
        ) : (
          <p className="text-white/40 text-sm text-center py-3">Dette event er afholdt.</p>
        )}
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const EventDetails: React.FC = () => {
  const { eventName } = useParams();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [selectedArtist, setSelectedArtist] = React.useState<Artist | null>(null);
  const [selectedCollabArtists, setSelectedCollabArtists] = React.useState<Artist[] | null>(null);

  const isValidEventName = eventName && typeof eventName === 'string' && eventName.trim() !== '';
  const { data: event, loading, error } = useEvent(isValidEventName ? eventName : '');

  // Parallax
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    layoutEffect: false,
    offset: ['start start', 'end start'],
  });
  const heroBgY      = useTransform(heroScroll, [0, 1], ['0%', '22%']);
  const heroContentOp = useTransform(heroScroll, [0, 0.65], [1, 0]);
  const scrollIndOp  = useTransform(heroScroll, [0, 0.15], [1, 0]);

  // ── Loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner size="lg" text="Henter event…" />
      </div>
    );
  }

  if (!isValidEventName || error || !event) {
    return (
      <div className="flex items-center justify-center h-[60vh] px-6">
        <div className="text-center">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            {!isValidEventName ? 'Ugyldigt event navn' : 'Event ikke fundet'}
          </h2>
          <p className="text-white/50 mb-6 text-sm max-w-xs mx-auto">
            {!isValidEventName
              ? 'URL-adressen indeholder ikke et gyldigt event navn.'
              : 'Dette event eksisterer ikke eller er blevet fjernet.'}
          </p>
          <motion.button
            onClick={() => navigate('/events')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="px-6 py-3 rounded-full bg-l8-blue text-l8-dark font-semibold text-sm"
          >
            Tilbage til Events
          </motion.button>
        </div>
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────────────

  const isUpcoming = new Date(event.date) >= new Date();
  const billettoLink = event.billettoURL || null;
  const heroImage = event.imageUrl
    ? constructFullUrl(event.imageUrl)
    : event.venue?.imageUrl
      ? constructFullUrl(event.venue.imageUrl)
      : null;

  const timeline: TimelineItem[] = event.timeline ?? [];
  const effectiveTimes = computeEffectiveTimes(timeline);
  const totalRuntime = timeline.reduce((sum, i) => sum + (i.durationMinutes ?? 0), 0);

  const publishedGallery = (event.galleryImages ?? [])
    .filter(img => img.isPublished)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const formatDate = (d: string) => {
    const s = new Date(d).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*  HERO                                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div ref={heroRef} className="relative h-screen overflow-hidden">

        {/* Parallax background image */}
        <motion.div className="absolute inset-0 scale-110" style={{ y: heroBgY }}>
          {heroImage ? (
            <img
              src={heroImage}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-l8-blue-dark/50 to-[#050505]" />
          )}
        </motion.div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/55 to-[#050505]/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/65 via-[#050505]/20 to-transparent" />

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            WebkitMaskImage: 'radial-gradient(ellipse 100% 80% at 50% 100%, transparent 30%, black 80%)',
            maskImage:        'radial-gradient(ellipse 100% 80% at 50% 100%, transparent 30%, black 80%)',
          }}
        />

        {/* Hero content — fades out on scroll */}
        <motion.div
          style={{ opacity: heroContentOp }}
          className="absolute bottom-0 left-0 right-0 z-10 px-6 sm:px-10 lg:px-16 pb-16 sm:pb-24 max-w-5xl"
        >
          {/* Status pill */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full
              border border-l8-blue/25 bg-l8-blue/10 text-l8-blue text-[10px] tracking-[0.35em] uppercase"
          >
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-l8-blue"
              animate={isUpcoming ? { opacity: [1, 0.2, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {isUpcoming ? 'Kommende Begivenhed' : 'Afholdt'}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold text-white
              leading-[1.0] mb-6"
          >
            {event.title}
          </motion.h1>

          {/* Info chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-2.5 mb-9"
          >
            <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full
              bg-white/[0.08] border border-white/12 text-white/75 text-sm backdrop-blur-sm">
              <Calendar className="w-3.5 h-3.5 text-l8-beige shrink-0" />
              {formatDate(event.date)}
            </span>
            {event.startTime && (
              <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full
                bg-white/[0.08] border border-white/12 text-white/75 text-sm backdrop-blur-sm">
                <Clock className="w-3.5 h-3.5 text-l8-beige shrink-0" />
                {event.startTime}{event.endTime ? ` — ${event.endTime}` : ''}
              </span>
            )}
            {event.venue && (
              <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full
                bg-white/[0.08] border border-white/12 text-white/75 text-sm backdrop-blur-sm">
                <MapPin className="w-3.5 h-3.5 text-l8-beige shrink-0" />
                {event.venue.name}
              </span>
            )}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.78, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-4"
          >
            {isUpcoming && billettoLink && (
              <motion.a
                href={billettoLink}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, boxShadow: '0 0 36px rgba(0,192,255,0.35)' }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-full
                  bg-l8-blue text-l8-dark font-bold text-sm tracking-wide shadow-xl shadow-l8-blue/25"
              >
                <Ticket className="w-4 h-4" />
                Køb Billetter
              </motion.a>
            )}
            {timeline.length > 0 && (
              <motion.button
                onClick={() => document.getElementById('program')?.scrollIntoView({ behavior: 'smooth' })}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-full border border-white/20
                  bg-white/[0.06] text-white/80 text-sm tracking-wide backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                Se Program
                <ChevronDown className="w-4 h-4" />
              </motion.button>
            )}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          style={{ opacity: scrollIndOp }}
          className="absolute bottom-8 right-8 sm:right-12 z-20 hidden sm:flex flex-col items-center
            gap-2 text-white/25 text-[9px] tracking-[0.4em] uppercase pointer-events-none"
        >
          <span>Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*  MAIN CONTENT                                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="container mx-auto max-w-6xl px-4 py-16 sm:py-24 pb-32 lg:pb-24">
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-16 lg:items-start">

          {/* ── Left: primary content ─────────────────────────────────────── */}
          <div className="space-y-20">

            {/* Description */}
            {event.description && (
              <FadeUp>
                <SectionLabel>Om Eventet</SectionLabel>
                <p className="text-white/70 text-lg leading-relaxed">{event.description}</p>
              </FadeUp>
            )}

            {/* Program / Timeline */}
            {timeline.length > 0 && (
              <FadeUp>
                <div id="program">
                  <SectionLabel>Program</SectionLabel>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">Aftenens Forløb</h2>

                  <div className="relative">
                    {/* Connecting line */}
                    <div className="absolute left-[15px] top-8 bottom-8 w-px bg-gradient-to-b from-l8-blue/40 via-white/10 to-transparent pointer-events-none" />

                    <div className="space-y-0">
                      {timeline.map((item, idx) => {
                        const time = effectiveTimes[idx];
                        const isCollab = item.type === 'collab_set';
                        const meta = TYPE_META[item.type] ?? TYPE_META.custom;
                        const isArtistSlot = item.type === 'artist_set' || item.type === 'dj_set' || isCollab;

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -14 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-20px' }}
                            transition={{ duration: 0.5, delay: idx * 0.055, ease: [0.16, 1, 0.3, 1] }}
                            className="flex items-center gap-4 py-3.5"
                          >
                            {/* Position dot */}
                            <div
                              className="relative z-10 w-8 h-8 rounded-full border flex items-center justify-center shrink-0 text-[11px] font-bold"
                              style={{
                                borderColor: isArtistSlot ? meta.color : 'rgba(255,255,255,0.1)',
                                background:  isArtistSlot ? meta.bg   : 'rgba(255,255,255,0.03)',
                                color:       meta.color,
                              }}
                            >
                              {idx + 1}
                            </div>

                            {/* Content */}
                            {(() => {
                              const handleClick = isArtistSlot ? () => {
                                if (isCollab && item.collaborators?.length) {
                                  const artists = item.collaborators
                                    .map(c => event.eventArtists?.find(ea => ea.artist.id === c.artistId)?.artist)
                                    .filter((a): a is Artist => !!a);
                                  if (artists.length) setSelectedCollabArtists(artists);
                                } else if (item.artistId) {
                                  const artist = event.eventArtists?.find(ea => ea.artist.id === item.artistId)?.artist ?? null;
                                  if (artist) setSelectedArtist(artist);
                                }
                              } : undefined;

                              return (
                                <div
                                  className={`flex-1 flex items-center justify-between gap-3 min-w-0 ${isArtistSlot ? 'cursor-pointer group' : ''}`}
                                  onClick={handleClick}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center flex-wrap gap-2 mb-0.5">
                                      <span
                                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                                        style={{ background: meta.bg, color: meta.color }}
                                      >
                                        {meta.label}
                                      </span>
                                      {time && (
                                        <span className="text-white/35 text-[11px] font-mono shrink-0">{time}</span>
                                      )}
                                    </div>
                                    <p className={`truncate font-semibold transition-colors ${isArtistSlot ? 'text-white text-base group-hover:text-l8-blue' : 'text-white/55 text-sm'}`}>
                                      {item.title}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    {item.durationMinutes != null && (
                                      <span className="text-white/25 text-[11px] hidden sm:block">
                                        {formatDuration(item.durationMinutes)}
                                      </span>
                                    )}
                                    {isCollab && item.collaborators?.length ? (
                                      <div className="flex -space-x-2 shrink-0">
                                        {item.collaborators.map(c => {
                                          const ea = event.eventArtists?.find(e => e.artist.id === c.artistId);
                                          const imgUrl = ea?.artist.imageUrl ? constructFullUrl(ea.artist.imageUrl) : null;
                                          return imgUrl ? (
                                            <img
                                              key={c.id}
                                              src={imgUrl}
                                              alt={c.name}
                                              className="w-10 h-10 rounded-lg object-cover border-2 border-[#0a0a0a] shrink-0"
                                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                          ) : null;
                                        })}
                                      </div>
                                    ) : item.artistImageUrl ? (
                                      <img
                                        src={constructFullUrl(item.artistImageUrl)}
                                        alt={item.artistName ?? item.title}
                                        className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                      />
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })()}
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Total runtime */}
                    {totalRuntime > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/[0.07] flex items-center justify-between">
                        <span className="text-white/30 text-[10px] tracking-[0.3em] uppercase">Total spilletid</span>
                        <span className="text-white/55 text-sm font-medium">{formatDuration(totalRuntime)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </FadeUp>
            )}

            {/* Artists */}
            {event.eventArtists && event.eventArtists.length > 0 && (
              <FadeUp>
                <SectionLabel>Kunstnere</SectionLabel>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
                  <Music className="inline w-6 h-6 mr-2 mb-1 text-l8-beige" />
                  På Scenen
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.eventArtists.map((ea, idx) => (
                    <motion.div
                      key={ea.id}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-20px' }}
                      transition={{ duration: 0.5, delay: idx * 0.09, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedArtist(ea.artist)}
                      className="group cursor-pointer rounded-2xl border border-white/10
                        bg-white/[0.04] overflow-hidden
                        hover:border-white/20 hover:bg-white/[0.07] transition-all duration-300"
                    >
                      <div className="flex items-stretch">
                        {/* Photo */}
                        <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 overflow-hidden">
                          <img
                            src={ea.artist.imageUrl
                              ? constructFullUrl(ea.artist.imageUrl)
                              : 'https://via.placeholder.com/300x300/0d0d0d/444444?text=A'}
                            alt={ea.artist.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={e => {
                              const t = e.target as HTMLImageElement;
                              if (!t.src.includes('placeholder')) t.src = 'https://via.placeholder.com/300x300/0d0d0d/444444?text=A';
                            }}
                          />
                        </div>
                        {/* Info */}
                        <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                          <p className="text-l8-beige text-[10px] tracking-[0.3em] uppercase mb-1">
                            {ea.artist.genre || 'Musik'}
                          </p>
                          <h3 className="text-white font-bold text-base mb-1 truncate group-hover:text-l8-beige transition-colors">
                            {ea.artist.name}
                          </h3>
                          <p className="text-white/45 text-xs leading-relaxed line-clamp-2">{ea.artist.bio}</p>
                          <span className="mt-2 text-l8-blue text-[11px]">Læs mere →</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </FadeUp>
            )}

            {/* Gallery */}
            {publishedGallery.length > 0 && (
              <FadeUp>
                <SectionLabel>Galleri</SectionLabel>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
                  <Camera className="inline w-6 h-6 mr-2 mb-1 text-l8-beige" />
                  Billeder
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {publishedGallery.map((img, idx) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.94 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: '-16px' }}
                      transition={{ duration: 0.45, delay: idx * 0.05 }}
                      whileHover={{ scale: 1.03, zIndex: 10 }}
                      className="group relative rounded-xl overflow-hidden border border-white/10 aspect-square"
                    >
                      <img
                        src={img.largeUrl ? constructFullUrl(img.largeUrl) : img.url ? constructFullUrl(img.url) : 'https://via.placeholder.com/400x400'}
                        alt={img.caption || ''}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400/0d0d0d/444444?text=Billede'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {img.caption && (
                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <p className="text-white text-xs font-medium line-clamp-2">{img.caption}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </FadeUp>
            )}

            {/* Venue */}
            {event.venue && (
              <FadeUp>
                <SectionLabel>Lokation</SectionLabel>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{event.venue.name}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/55 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-l8-beige shrink-0" />{event.venue.address}
                  </span>
                  {event.venue.city && (
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/55 text-xs">
                      {event.venue.city}
                    </span>
                  )}
                </div>
                {event.venue.description && (
                  <p className="text-white/45 text-sm leading-relaxed mb-6">{event.venue.description}</p>
                )}
                {event.venue.mapEmbedHtml && (
                  <div className="rounded-2xl overflow-hidden border border-white/10">
                    <VenueMapEmbed
                      embedHtml={event.venue.mapEmbedHtml}
                      title={`Kort over ${event.venue.name}`}
                      height={360}
                    />
                  </div>
                )}
              </FadeUp>
            )}

            {/* Past event message */}
            {!isUpcoming && (
              <FadeUp>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
                  <p className="text-white/55 mb-6 leading-relaxed text-sm">
                    Dette event er afholdt. Tak til alle der deltog og gjorde aftenen uforglemmelig.
                  </p>
                  <motion.button
                    onClick={() => navigate('/events')}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="px-6 py-3 rounded-full bg-l8-blue text-l8-dark font-semibold text-sm"
                  >
                    Se Kommende Events
                  </motion.button>
                </div>
              </FadeUp>
            )}
          </div>

          {/* ── Right: sticky ticket widget (desktop only) ────────────────── */}
          <div className="hidden lg:block">
            <div className="sticky top-28 space-y-4">
              {billettoLink ? (
                <TicketWidget
                  billettoLink={billettoLink}
                  billettoData={event.billettoData}
                  isUpcoming={isUpcoming}
                  title={event.title}
                />
              ) : (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl overflow-hidden">
                  <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <div className="p-6 text-center space-y-2">
                    <SectionLabel>Entré</SectionLabel>
                    <p className="text-white font-semibold text-base leading-snug">{event.title}</p>
                    <p className="text-green-400 font-bold text-lg pt-1">Gratis entré</p>
                    <p className="text-white/30 text-xs">Ingen billet nødvendig</p>
                  </div>
                </div>
              )}

              {/* Quick info recap */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 space-y-3.5">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-l8-beige shrink-0" />
                  <span className="text-white/55">{formatDate(event.date)}</span>
                </div>
                {event.startTime && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-l8-beige shrink-0" />
                    <span className="text-white/55">
                      {event.startTime}{event.endTime ? ` — ${event.endTime}` : ''}
                    </span>
                  </div>
                )}
                {event.venue && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-l8-beige shrink-0" />
                    <span className="text-white/55">{event.venue.name}</span>
                  </div>
                )}
                {event.eventArtists?.length > 0 && (
                  <div className="flex items-start gap-3 text-sm">
                    <Music className="w-4 h-4 text-l8-beige shrink-0 mt-0.5" />
                    <span className="text-white/55 leading-relaxed">
                      {event.eventArtists.map(ea => ea.artist.name).join(' · ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky bottom CTA ──────────────────────────────────────── */}
      {isUpcoming && billettoLink && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          transition={{ delay: 1.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-4
            bg-[#050505]/90 backdrop-blur-xl border-t border-white/10"
        >
          <motion.a
            href={billettoLink}
            target="_blank"
            rel="noopener noreferrer"
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2.5 w-full py-4 rounded-xl
              bg-l8-blue text-l8-dark font-bold tracking-wide shadow-xl shadow-l8-blue/25"
          >
            <Ticket className="w-4 h-4" />
            Køb Billetter
          </motion.a>
        </motion.div>
      )}

      {/* Artist modal */}
      <ArtistModal artist={selectedArtist} onClose={() => setSelectedArtist(null)} isAdmin={false} />

      {/* Collab slot modal */}
      <AnimatePresence>
        {selectedCollabArtists && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedCollabArtists(null)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="pointer-events-auto w-full max-w-lg bg-[#0e0e0e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
                  <div>
                    <p className="text-white/40 text-[11px] tracking-widest uppercase font-mono mb-0.5">Collaboration</p>
                    <h3 className="text-white font-bold text-lg">{selectedCollabArtists.map(a => a.name).join(' & ')}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedCollabArtists(null)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>
                <div className="p-6 flex flex-col gap-3">
                  {selectedCollabArtists.map(artist => (
                    <button
                      key={artist.id}
                      onClick={() => { setSelectedCollabArtists(null); setSelectedArtist(artist); }}
                      className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors text-left w-full"
                    >
                      {artist.imageUrl ? (
                        <img
                          src={constructFullUrl(artist.imageUrl)}
                          alt={artist.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-white/10 shrink-0 flex items-center justify-center text-white/30 text-xl font-bold">
                          {artist.name[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-base truncate">{artist.name}</p>
                        {artist.genre && <p className="text-white/40 text-sm truncate">{artist.genre}</p>}
                      </div>
                      <ExternalLink className="w-4 h-4 text-white/25 shrink-0 ml-auto" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventDetails;
