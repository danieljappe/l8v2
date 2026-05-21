// Icons + small primitives shared across the prototype.
// Icons are minimal inline SVGs — feather-style, currentColor.

function I(props) {
  const { name, className = 'ic', size, style } = props;
  const s = size ? { width: size, height: size, ...style } : style;
  const common = {
    className, style: s, width: 16, height: 16,
    viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.7,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (name) {
    case 'home': return <svg {...common}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg>;
    case 'calendar': return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
    case 'users': return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'pin': return <svg {...common}><path d="M12 22s-7-7.5-7-13a7 7 0 1 1 14 0c0 5.5-7 13-7 13Z"/><circle cx="12" cy="9" r="2.5"/></svg>;
    case 'image': return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>;
    case 'message': return <svg {...common}><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.4 8.4 0 0 1-4-1L3 21l2-5.5a8.4 8.4 0 0 1-1-4A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z"/></svg>;
    case 'user': return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
    case 'arrow-left': return <svg {...common}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;
    case 'logout': return <svg {...common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg>;
    case 'plus': return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'search': return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case 'edit': return <svg {...common}><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.12 2.12 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>;
    case 'trash': return <svg {...common}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>;
    case 'copy': return <svg {...common}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
    case 'more': return <svg {...common}><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>;
    case 'x': return <svg {...common}><path d="M18 6 6 18M6 6l12 12"/></svg>;
    case 'check': return <svg {...common}><path d="m5 12 5 5L20 7"/></svg>;
    case 'chevron-down': return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>;
    case 'chevron-right': return <svg {...common}><path d="m9 6 6 6-6 6"/></svg>;
    case 'sort-asc': return <svg {...common}><path d="M3 6h13M3 12h9M3 18h5"/><path d="m17 9 3-3 3 3M20 6v15"/></svg>;
    case 'sort-desc': return <svg {...common}><path d="M3 6h5M3 12h9M3 18h13"/><path d="m17 15 3 3 3-3M20 18V3"/></svg>;
    case 'clock': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'ticket': return <svg {...common}><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9Z"/><path d="M13 6v2M13 11v2M13 16v2"/></svg>;
    case 'upload': return <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/></svg>;
    case 'table': return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>;
    case 'list': return <svg {...common}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>;
    case 'grid': return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
    case 'timeline': return <svg {...common}><path d="M3 5h7M14 5h7M3 12h7M14 12h7M3 19h7M14 19h7"/></svg>;
    case 'filter': return <svg {...common}><path d="M3 5h18l-7 9v6l-4-2v-4L3 5Z"/></svg>;
    case 'arrow-right': return <svg {...common}><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
    case 'sparkle': return <svg {...common}><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.5 5.5l4 4M14.5 14.5l4 4M18.5 5.5l-4 4M9.5 14.5l-4 4"/></svg>;
    case 'eye': return <svg {...common}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'dollar': return <svg {...common}><path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    case 'instagram': return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/></svg>;
    case 'spotify': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M7 10c3-1 8-1 11 1M7.5 13.5c2.5-.8 6.5-.6 9 1M8 17c2-.5 5-.4 7 .8"/></svg>;
    case 'soundcloud': return <svg {...common}><path d="M3 16v-4M5.5 17V11M8 18v-9M10.5 18v-7M13 18v-9c2-1.5 5-1.5 6.5.5 1.5 0 2.5 1 2.5 2.5s-1 3-3 3H13"/></svg>;
    case 'bandcamp': return <svg {...common}><path d="m3 18 5-12h13l-5 12H3Z"/></svg>;
    case 'globe': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 3 4 6 4 9s-1.5 6-4 9c-2.5-3-4-6-4-9s1.5-6 4-9Z"/></svg>;
    case 'shield': return <svg {...common}><path d="M12 3 4 6v6c0 5 3 8 8 9 5-1 8-4 8-9V6l-8-3Z"/></svg>;
    case 'tag': return <svg {...common}><path d="m20 13-8 8-9-9V3h9l8 8a1.5 1.5 0 0 1 0 2Z"/><circle cx="7.5" cy="7.5" r="1"/></svg>;
    case 'star': return <svg {...common}><path d="M12 3 9.5 9 3 10l5 5-1 7 5-3 5 3-1-7 5-5-6.5-1L12 3Z"/></svg>;
    default: return null;
  }
}

// Status pill helper
function StatusPill({ status }) {
  return <span className={`pill pill-${status}`}>{status}</span>;
}

// Poster art — used by row + grid layouts. Striped placeholder with palette.
function Poster({ event, big = false }) {
  const palette = event.posterPalette || ['#1c1b18', '#fff'];
  const [bg, ink] = [palette[0], '#fff'];
  const date = window.fmtDateParts(event.date);
  if (big) {
    return (
      <div className="poster-art" style={{ '--poster-bg': bg, '--poster-ink': ink }}>
        <div className="date">{date.day} {date.month} {date.year}</div>
        <h3 className="ttl">{event.title}</h3>
        <div className="arts">
          {window.artistsById(event.artistIds).slice(0, 4).map(a => a.name).join(' · ')}
          {event.artistIds.length > 4 ? ` · +${event.artistIds.length - 4}` : ''}
        </div>
        {event.status !== 'upcoming' && (
          <div className="status-mark">{event.status}</div>
        )}
      </div>
    );
  }
  return (
    <div className="row-poster" style={{ '--poster-bg': bg, '--poster-ink': ink, color: ink }}>
      {event.title.match(/[A-Za-zÆØÅ]/)?.[0] || '·'}
      <div className="pd">{date.day}.{String(parseInt(event.date.split('-')[1])).padStart(2,'0')}</div>
    </div>
  );
}

// Tiny progress chip for sold/capacity
function SoldRatio({ event }) {
  const pct = event.capacity ? Math.round((event.sold / event.capacity) * 100) : 0;
  return (
    <div className="row-prog">
      {event.sold.toLocaleString()} / {event.capacity.toLocaleString()}
      <div className="bar"><i style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

Object.assign(window, { I, StatusPill, Poster, SoldRatio });

// Artist helpers
function monogram(name) {
  if (!name) return '·';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SOCIAL_PLATFORMS = [
  { key: 'instagram',  icon: 'instagram',  label: 'Instagram',  baseUrl: 'instagram.com/' },
  { key: 'spotify',    icon: 'spotify',    label: 'Spotify',    baseUrl: 'open.spotify.com/artist/' },
  { key: 'soundcloud', icon: 'soundcloud', label: 'SoundCloud', baseUrl: 'soundcloud.com/' },
  { key: 'bandcamp',   icon: 'bandcamp',   label: 'Bandcamp',   baseUrl: '' },
  { key: 'website',    icon: 'globe',      label: 'Website',    baseUrl: '' },
];

function SocialIcons({ socials, max = 4 }) {
  if (!socials) return null;
  const entries = Object.entries(socials).filter(([_, v]) => !!v).slice(0, max);
  return (
    <div className="socials">
      {entries.map(([key, val]) => {
        const p = SOCIAL_PLATFORMS.find(x => x.key === key);
        return <span className="s" title={`${p?.label || key}: ${val}`} key={key}><I name={p?.icon || 'globe'} /></span>;
      })}
    </div>
  );
}

// Derive a deterministic placeholder color from a name.
// Used only when a record has no imageUrl yet — pure UI computation, not persisted.
function colorFromName(name) {
  if (!name) return 'oklch(0.55 0.05 250)';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const hue = ((hash % 360) + 360) % 360;
  return `oklch(0.55 0.14 ${hue})`;
}

Object.assign(window, { monogram, SocialIcons, SOCIAL_PLATFORMS, colorFromName });
