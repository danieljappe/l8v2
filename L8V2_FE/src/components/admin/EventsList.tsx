import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Event, Artist, Venue } from '../../types/admin';
import EventForm, { emptyEventDraft } from './EventForm';
import apiService from '../../services/api';
import { slugify } from '../../utils/slugUtils';

interface EventsListProps {
  events: Event[];
  onAddEvent: (eventData: Omit<Event, 'id' | 'createdAt'>) => void;
  onUpdateEvent: (event: Event) => void;
  onDeleteEvent: (id: string) => void;
  artists: Artist[];
  venues: Venue[];
  onRemoveArtist?: (eventId: string, artistId: string) => void;
  onAddArtistToEvent?: (eventId: string, artistId: string) => void;
  onSyncBilletto?: () => Promise<{ linked: number; total: number; errors: string[] } | null>;
}

type SortCol = 'date' | 'title' | 'venue' | 'status' | 'sold';
type ViewMode = 'table' | 'rows' | 'grid' | 'timeline';

function fmtDateParts(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return {
      day: d.getDate(),
      month: d.toLocaleDateString('en-GB', { month: 'short' }),
      year: d.getFullYear(),
      dow: d.toLocaleDateString('en-GB', { weekday: 'short' }),
      mm: String(d.getMonth() + 1).padStart(2, '0'),
    };
  } catch {
    return { day: '?', month: '???', year: '????', dow: '???', mm: '00' };
  }
}

function posterColor(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) | 0;
  const hue = ((h % 360) + 360) % 360;
  return `oklch(0.35 0.12 ${hue})`;
}

function SortIcon({ col, sort }: { col: string; sort: { col: string; dir: string } }) {
  if (sort.col !== col) return (
    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginLeft: 4 }}>
      <path d="M12 5v14M5 12l7-7 7 7" />
    </svg>
  );
  return (
    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
      {sort.dir === 'asc'
        ? <path d="M12 5v14M5 12l7-7 7 7" />
        : <path d="M12 19V5M5 12l7 7 7-7" />}
    </svg>
  );
}

type SyncState = 'idle' | 'syncing' | 'done' | 'error';

export default function EventsList({
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  artists,
  venues,
  onRemoveArtist,
  onAddArtistToEvent,
  onSyncBilletto,
}: EventsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [newEventDraft, setNewEventDraft] = useState(emptyEventDraft);
  const [view, setView] = useState<ViewMode>('table');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState<{ col: SortCol; dir: 'asc' | 'desc' }>({ col: 'date', dir: 'desc' });
  const [confirmDel, setConfirmDel] = useState<Event | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncResult, setSyncResult] = useState<{ linked: number; total: number; errors: string[] } | null>(null);

  const handleSync = useCallback(async () => {
    if (!onSyncBilletto || syncState === 'syncing') return;
    setSyncState('syncing');
    setSyncResult(null);
    const result = await onSyncBilletto();
    if (result) {
      setSyncResult(result);
      setSyncState('done');
    } else {
      setSyncState('error');
    }
    setTimeout(() => setSyncState('idle'), 4000);
  }, [onSyncBilletto, syncState]);

  useEffect(() => {
    if (editingEvent) {
      const updated = events.find(e => e.id === editingEvent.id);
      if (updated) setEditingEvent(updated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, editingEvent?.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setConfirmDel(null); setShowForm(false); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function handleSort(col: SortCol) {
    setSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  }

  async function handleEdit(ev: Event) {
    setShowForm(true);
    // Re-fetch to get fresh timeline data before opening the drawer
    const res = await apiService.getEvent(ev.id);
    setEditingEvent(res.data ? { ...ev, timeline: res.data.timeline ?? [] } : ev);
  }
  function handleNew() { setEditingEvent(null); setShowForm(true); }
  function handleDelete(ev: Event) { setConfirmDel(ev); }

  function handleFormSubmit(data: Omit<Event, 'id' | 'createdAt'>) {
    if (editingEvent) {
      onUpdateEvent({ ...editingEvent, ...data });
    } else {
      onAddEvent(data);
      setNewEventDraft(emptyEventDraft);
    }
    setShowForm(false);
    setEditingEvent(null);
  }

  const filtered = useMemo(() => {
    let list = events;
    if (q.trim()) {
      const lq = q.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(lq) ||
        (venues.find(v => v.id === e.venue)?.name || '').toLowerCase().includes(lq) ||
        (e.eventArtists?.some(ea => ea.artist.name.toLowerCase().includes(lq)) ?? false)
      );
    }
    if (statusFilter !== 'all') list = list.filter(e => e.status === statusFilter);
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sort.col === 'title') return a.title.localeCompare(b.title) * dir;
      if (sort.col === 'venue') {
        const va = venues.find(v => v.id === a.venue)?.name || '';
        const vb = venues.find(v => v.id === b.venue)?.name || '';
        return va.localeCompare(vb) * dir;
      }
      if (sort.col === 'status') return a.status.localeCompare(b.status) * dir;
      if (sort.col === 'sold') return ((a.soldTickets ?? 0) - (b.soldTickets ?? 0)) * dir;
      return a.date.localeCompare(b.date) * dir;
    });
  }, [events, q, statusFilter, sort, venues]);

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: events.length };
    events.forEach(e => { out[e.status] = (out[e.status] || 0) + 1; });
    return out;
  }, [events]);

  // ── Timeline grouped by month ──────────────────────────────
  const byMonth = useMemo(() => {
    const groups = new Map<string, Event[]>();
    filtered.forEach(ev => {
      const key = ev.date ? ev.date.slice(0, 7) : 'Unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(ev);
    });
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const venueName = (id: string) => venues.find(v => v.id === id)?.name || '';

  return (
    <div>
      <div className="a-topbar">
        <div className="a-topbar-head">
          <div>
            <h2>Events</h2>
            <div className="a-topbar-sub">
              {counts.all} total · {counts.upcoming ?? 0} upcoming · {counts.completed ?? 0} completed
              {counts.draft ? ` · ${counts.draft} draft` : ''}
            </div>
          </div>
          <div className="a-topbar-actions">
            {onSyncBilletto && (
              <button
                className="a-btn a-btn-ghost"
                onClick={handleSync}
                disabled={syncState === 'syncing'}
                title="Pull latest ticket data from Billetto"
              >
                {syncState === 'syncing' ? (
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg>
                ) : (
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                )}
                {syncState === 'syncing' && 'Syncing…'}
                {syncState === 'done' && syncResult && `Synced ${syncResult.linked}/${syncResult.total}`}
                {syncState === 'error' && 'Sync failed'}
                {syncState === 'idle' && 'Sync Billetto'}
              </button>
            )}
            <button className="a-btn a-btn-primary" onClick={handleNew}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              New event
              <span className="a-kbd">N</span>
            </button>
          </div>
        </div>

        <div className="a-toolbar">
          <div className="a-search">
            <svg className="a-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <circle cx={11} cy={11} r={7}/><path d="m20 20-3.5-3.5"/>
            </svg>
            <input placeholder="Search events, artists, venues…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'upcoming', 'completed', 'draft', 'cancelled'] as const).map(s => (
              <button key={s} className={`a-chip${statusFilter === s ? ' is-on' : ''}`} onClick={() => setStatusFilter(s)}>
                {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
                <span className="ct">{counts[s] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="a-divider" />
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>View</span>
            <div className="a-viewswitch">
              {([
                { id: 'table', label: 'Table', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={18} height={18} rx={2}/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg> },
                { id: 'rows', label: 'Rows', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg> },
                { id: 'grid', label: 'Grid', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={7} height={7} rx={1}/><rect x={14} y={3} width={7} height={7} rx={1}/><rect x={3} y={14} width={7} height={7} rx={1}/><rect x={14} y={14} width={7} height={7} rx={1}/></svg> },
                { id: 'timeline', label: 'Timeline', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h7M14 5h7M3 12h7M14 12h7M3 19h7M14 19h7"/></svg> },
              ] as const).map(v => (
                <button key={v.id} className={view === v.id ? 'is-on' : ''} title={v.label} onClick={() => setView(v.id)}>
                  {v.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="a-body">
        {filtered.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-3)' }}>No events found</div>
        )}

        {/* TABLE view */}
        {view === 'table' && filtered.length > 0 && (
          <div className="a-tbl-wrap">
            <table className="a-tbl">
              <thead>
                <tr>
                  <th onClick={() => handleSort('title')} style={{ paddingLeft: 56 }}>
                    Event <SortIcon col="title" sort={sort} />
                  </th>
                  <th onClick={() => handleSort('date')}>Date <SortIcon col="date" sort={sort} /></th>
                  <th onClick={() => handleSort('venue')}>Venue <SortIcon col="venue" sort={sort} /></th>
                  <th onClick={() => handleSort('status')}>Status <SortIcon col="status" sort={sort} /></th>
                  <th>Tickets</th>
                  <th className="a-actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(ev => {
                  const dp = fmtDateParts(ev.date);
                  const bg = posterColor(ev.title);
                  const letter = /[A-Za-z]/.exec(ev.title)?.[0] || '·';
                  const sold = ev.soldTickets ?? 0;
                  const cap = ev.maxCapacity ?? ev.totalTickets ?? ev.capacity ?? 0;
                  const pct = cap ? Math.round((sold / cap) * 100) : 0;
                  const vName = venueName(ev.venue);
                  const artNames = ev.eventArtists?.slice(0, 3).map(ea => ea.artist.name) ?? [];
                  return (
                    <tr key={ev.id} style={{ cursor: 'pointer' }} onClick={() => handleEdit(ev)}>
                      <td style={{ paddingLeft: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: 6, flexShrink: 0,
                            background: `repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 8px), ${bg}`,
                            color: 'white', display: 'grid', placeItems: 'center',
                            fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '-0.02em',
                            marginLeft: 16,
                          }}>{letter}</div>
                          <div>
                            <div className="ev-title">{ev.title}</div>
                            {artNames.length > 0 && (
                              <div className="ev-meta">
                                {artNames.map(n => <span key={n} className="a-artist-chip">{n}</span>)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <div className="d">{dp.day} {dp.month} {dp.year}</div>
                          {ev.time && <div className="t">{ev.time}</div>}
                        </div>
                      </td>
                      <td style={{ color: 'var(--ink-2)', fontSize: 13 }}>{vName}</td>
                      <td><span className={`a-pill a-pill-${ev.status}`}>{ev.status}</span></td>
                      <td>
                        <div style={{ fontSize: 13 }}>
                          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{sold.toLocaleString()}</span>
                          <span style={{ color: 'var(--ink-3)' }}> / {cap.toLocaleString()}</span>
                        </div>
                        <div style={{ marginTop: 4, height: 3, background: 'var(--line)', borderRadius: 2, width: 80 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--ok)', borderRadius: 2 }} />
                        </div>
                      </td>
                      <td className="a-actions" onClick={e => e.stopPropagation()}>
                        <a className="a-btn a-btn-ghost a-btn-icon" title="Preview public page" href={`/events/${slugify(ev.title)}`} target="_blank" rel="noopener noreferrer">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </a>
                        <button className="a-btn a-btn-ghost a-btn-icon" title="Edit" onClick={() => handleEdit(ev)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.12 2.12 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
                        </button>
                        <button className="a-btn a-btn-ghost a-btn-icon a-btn-danger" title="Delete" onClick={() => handleDelete(ev)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ROWS view */}
        {view === 'rows' && filtered.length > 0 && (
          <div className="a-rows">
            {filtered.map(ev => {
              const dp = fmtDateParts(ev.date);
              const bg = posterColor(ev.title);
              const letter = /[A-Za-z]/.exec(ev.title)?.[0] || '·';
              const vName = venueName(ev.venue);
              const artNames = ev.eventArtists?.slice(0, 4).map(ea => ea.artist.name) ?? [];
              const sold = ev.soldTickets ?? 0;
              const cap = ev.maxCapacity ?? ev.totalTickets ?? ev.capacity ?? 0;
              const pct = cap ? Math.round((sold / cap) * 100) : 0;
              return (
                <div key={ev.id} className="a-row-card" onClick={() => handleEdit(ev)}>
                  <div className="a-row-poster" style={{ '--poster-bg': bg, '--poster-ink': 'white' } as React.CSSProperties}>
                    {letter}
                    <div className="pd">{dp.day}.{dp.mm}</div>
                  </div>
                  <div className="a-row-main">
                    <h3 className="a-row-title">{ev.title}</h3>
                    <div className="a-row-meta">
                      {vName && <span className="mi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-7-7.5-7-13a7 7 0 1 1 14 0c0 5.5-7 13-7 13Z"/><circle cx={12} cy={9} r={2.5}/></svg>{vName}</span>}
                      <span className="mi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={5} width={18} height={16} rx={2}/><path d="M3 10h18M8 3v4M16 3v4"/></svg>{dp.day} {dp.month} {dp.year}</span>
                      {ev.time && <span className="mi">{ev.time}</span>}
                    </div>
                    {artNames.length > 0 && (
                      <div className="a-row-artists">
                        {artNames.map(n => <span key={n} className="a-artist-chip">{n}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="a-row-side">
                    <span className={`a-pill a-pill-${ev.status}`}>{ev.status}</span>
                    <div style={{ fontSize: 12, color: 'var(--ink-2)', textAlign: 'right' }}>
                      {sold.toLocaleString()} / {cap.toLocaleString()}
                      <div style={{ marginTop: 3, height: 3, background: 'var(--line)', borderRadius: 2, width: 64 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--ok)', borderRadius: 2 }} />
                      </div>
                    </div>
                    <div className="a-row-actions" onClick={e => e.stopPropagation()}>
                      <a className="a-btn a-btn-ghost a-btn-icon a-btn-sm" title="Preview public page" href={`/events/${slugify(ev.title)}`} target="_blank" rel="noopener noreferrer">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                      <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm" onClick={() => handleEdit(ev)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.12 2.12 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
                      </button>
                      <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm a-btn-danger" onClick={() => handleDelete(ev)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* GRID view */}
        {view === 'grid' && filtered.length > 0 && (
          <div className="a-grid">
            {filtered.map(ev => {
              const dp = fmtDateParts(ev.date);
              const bg = posterColor(ev.title);
              const artNames = ev.eventArtists?.slice(0, 4).map(ea => ea.artist.name) ?? [];
              return (
                <div key={ev.id} className="a-poster-card" onClick={() => handleEdit(ev)}>
                  <div className="a-poster-art" style={{ '--poster-bg': bg } as React.CSSProperties}>
                    <div className="date">{dp.day} {dp.month} {dp.year}</div>
                    <div className="big-day">{dp.day}</div>
                    <div>
                      <h3 className="ttl">{ev.title}</h3>
                      {artNames.length > 0 && <div className="arts">{artNames.join(' · ')}</div>}
                    </div>
                    {ev.status !== 'upcoming' && <div className="a-poster-status-mark">{ev.status}</div>}
                  </div>
                  <div className="a-poster-meta">
                    <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{ev.time || '—'}</span>
                    <span className={`a-pill a-pill-${ev.status}`}>{ev.status}</span>
                    <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 3 }}>
                      <a className="a-btn a-btn-ghost a-btn-icon a-btn-sm" title="Preview public page" href={`/events/${slugify(ev.title)}`} target="_blank" rel="noopener noreferrer">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                      <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm" onClick={() => handleEdit(ev)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.12 2.12 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TIMELINE view */}
        {view === 'timeline' && (
          <div className="a-timeline">
            {byMonth.map(([month, evs]) => {
              const [yr, mo] = month.split('-');
              const moName = new Date(`${yr}-${mo}-01`).toLocaleDateString('en-GB', { month: 'long' });
              return (
                <div key={month}>
                  <div className="a-tl-month-h">
                    <h3 className="mo">{moName}</h3>
                    <span className="ct">{evs.length} event{evs.length !== 1 ? 's' : ''}</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{yr}</span>
                  </div>
                  {evs.map(ev => {
                    const dp = fmtDateParts(ev.date);
                    const vName = venueName(ev.venue);
                    const artNames = ev.eventArtists?.slice(0, 3).map(ea => ea.artist.name) ?? [];
                    return (
                      <div key={ev.id} className="a-tl-row" onClick={() => handleEdit(ev)} style={{ cursor: 'pointer' }}>
                        <div className="a-tl-date">
                          <div className="day">{dp.day}</div>
                          <div className="dow">{dp.dow}</div>
                        </div>
                        <div className="a-tl-mid">
                          <div className="ttl">{ev.title}</div>
                          <div className="meta">
                            {ev.time && <span className="mi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><circle cx={12} cy={12} r={9}/><path d="M12 7v5l3 2"/></svg>{ev.time}</span>}
                            {vName && <span className="mi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-7-7.5-7-13a7 7 0 1 1 14 0c0 5.5-7 13-7 13Z"/><circle cx={12} cy={9} r={2.5}/></svg>{vName}</span>}
                            {artNames.map(n => <span key={n} className="a-artist-chip">{n}</span>)}
                          </div>
                        </div>
                        <div className="a-tl-side" onClick={e => e.stopPropagation()}>
                          <span className={`a-pill a-pill-${ev.status}`}>{ev.status}</span>
                          <a className="a-btn a-btn-ghost a-btn-icon a-btn-sm" title="Preview public page" href={`/events/${slugify(ev.title)}`} target="_blank" rel="noopener noreferrer">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          </a>
                          <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm" onClick={() => handleEdit(ev)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.12 2.12 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
                          </button>
                          <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm a-btn-danger" onClick={() => handleDelete(ev)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Event Form — uses its own portal */}
      {showForm && (
        <EventForm
          event={editingEvent}
          onSubmit={handleFormSubmit}
          onCancel={() => { setShowForm(false); setEditingEvent(null); }}
          artists={artists}
          venues={venues}
          onRemoveArtist={onRemoveArtist}
          onAddArtistToEvent={onAddArtistToEvent}
          draft={editingEvent ? undefined : newEventDraft}
          onDraftChange={editingEvent ? undefined : setNewEventDraft}
        />
      )}

      {/* Confirm Delete */}
      {confirmDel && (
        <>
          <div className="a-scrim" onClick={() => setConfirmDel(null)} />
          <div className="a-modal-shell">
            <div className="a-modal-card" style={{ maxWidth: 460 }}>
              <div className="a-form-head">
                <div className="a-form-head-l">
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>Confirm</div>
                    <h3>Delete event?</h3>
                  </div>
                </div>
              </div>
              <div className="a-form-body">
                <p style={{ margin: 0, color: 'var(--ink-2)' }}>
                  This will remove <strong style={{ color: 'var(--ink)' }}>"{confirmDel.title}"</strong> permanently.
                </p>
              </div>
              <div className="a-form-foot">
                <span />
                <div className="a-form-foot-r">
                  <button className="a-btn a-btn-ghost" onClick={() => setConfirmDel(null)}>Cancel</button>
                  <button className="a-btn" style={{ background: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' }}
                    onClick={() => { onDeleteEvent(confirmDel.id); setConfirmDel(null); }}>
                    Delete event
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
