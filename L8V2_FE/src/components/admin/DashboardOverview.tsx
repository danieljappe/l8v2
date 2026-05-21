import { useMemo } from 'react';
import type { Event, Artist, Venue, GalleryItem, Message } from '../../types/admin';

interface DashboardOverviewProps {
  events: Event[];
  artists: Artist[];
  venues: Venue[];
  gallery: GalleryItem[];
  messages: Message[];
}

function fmtDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

export default function DashboardOverview({ events, artists, venues, gallery, messages }: DashboardOverviewProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const upcoming = useMemo(() =>
    [...events].filter(e => e.status === 'upcoming').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6),
    [events]
  );
  const unreadMessages = useMemo(() => messages.filter(m => !m.read), [messages]);
  const upcomingCount = useMemo(() => events.filter(e => e.status === 'upcoming').length, [events]);
  const publishedGallery = useMemo(() => gallery.filter(g => g.isPublished).length, [gallery]);

  return (
    <div>
      <div className="a-topbar">
        <div className="a-topbar-head">
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 50, lineHeight: 1, margin: 0, letterSpacing: '-0.025em', color: 'var(--ink)', fontWeight: 400 }}>
              {greeting}
            </h2>
            <div className="a-topbar-sub" style={{ marginTop: 8 }}>{today}</div>
          </div>
        </div>
        <div style={{ height: 1 }} />
      </div>

      <div className="a-body">
        {/* KPI stats row */}
        <div className="a-stat-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { num: events.length, label: 'Total events' },
            { num: upcomingCount, label: 'Upcoming' },
            { num: artists.length, label: 'Artists' },
            { num: unreadMessages.length, label: 'Unread messages', accent: unreadMessages.length > 0 },
          ].map(({ num, label, accent }) => (
            <div key={label} className="a-stat-card" style={{
              background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)',
              padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 1,
                letterSpacing: '-0.03em', color: accent ? 'var(--accent)' : 'var(--ink)',
                fontWeight: 400,
              }}>{num}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* 2-col section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
          {/* Next Up */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 20, margin: 0, letterSpacing: '-0.01em' }}>Next Up</h3>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{upcomingCount} upcoming</span>
            </div>
            {upcoming.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>No upcoming events</div>
            ) : (
              upcoming.map(ev => {
                const artistNames = ev.eventArtists?.map(ea => ea.artist.name).join(', ') || ev.artist || '';
                return (
                  <div key={ev.id} style={{
                    padding: '12px 20px', borderBottom: '1px solid var(--line-2)',
                    display: 'grid', gridTemplateColumns: '52px 1fr auto', gap: 16, alignItems: 'center',
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
                        {ev.date ? new Date(ev.date).getDate() : '—'}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 2 }}>
                        {ev.date ? new Date(ev.date).toLocaleDateString('en-GB', { month: 'short' }) : ''}
                      </div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '-0.01em', lineHeight: 1.15, color: 'var(--ink)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.title}
                      </div>
                      {artistNames && (
                        <div style={{ fontSize: 12, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {artistNames}
                        </div>
                      )}
                    </div>
                    <span className={`a-pill a-pill-${ev.status}`}>{ev.status}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Inbox preview */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 20, margin: 0, letterSpacing: '-0.01em' }}>Inbox</h3>
              {unreadMessages.length > 0 && (
                <span style={{ background: 'var(--accent)', color: 'white', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, height: 18, minWidth: 18, padding: '0 5px', borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadMessages.length}
                </span>
              )}
            </div>
            {messages.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>No messages</div>
            ) : (
              [...messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 7).map(msg => (
                <div key={msg.id} style={{
                  padding: '10px 20px', borderBottom: '1px solid var(--line-2)',
                  display: 'flex', flexDirection: 'column', gap: 3,
                  background: !msg.read ? 'transparent' : undefined,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {!msg.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
                    <span style={{ fontSize: 13, fontWeight: msg.read ? 400 : 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink)' }}>{msg.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{fmtDate(msg.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.subject}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
          {[
            { label: 'Gallery published', num: publishedGallery, total: gallery.length, desc: 'photos live' },
            { label: 'Venues', num: venues.length, total: venues.length, desc: 'configured' },
            { label: 'Artists bookable', num: artists.filter(a => a.isBookable).length, total: artists.length, desc: 'of ' + artists.length + ' on roster' },
          ].map(({ label, num, desc }) => (
            <div key={label} style={{
              background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)',
              padding: '16px 20px',
            }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
