import React, { useState, useEffect, useMemo } from 'react';
import type { Venue } from '../../types/admin';

interface VenuesListProps {
  venues: Venue[];
  onAddVenue: (venueData: Partial<Venue>) => void;
  onUpdateVenue: (venue: Venue) => void;
  onDeleteVenue: (id: string) => void;
}

type ViewMode = 'grid' | 'rows' | 'table';

function colorFromName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const hue = ((h % 360) + 360) % 360;
  return `oklch(0.50 0.08 ${hue})`;
}


function VenueMapPlaceholder({ pinColor }: { pinColor: string }) {
  return (
    <>
      <div className="grid-bg" />
      <svg className="roads" viewBox="0 0 280 175" preserveAspectRatio="none">
        <path d="M0 88 Q70 80 140 88 Q210 95 280 88" strokeWidth={8} />
        <path d="M0 55 Q60 50 120 60 Q180 70 200 55" strokeWidth={5} />
        <path d="M80 0 Q85 40 88 88 Q91 130 88 175" strokeWidth={8} />
        <path d="M160 0 Q165 45 162 88 Q159 130 162 175" strokeWidth={5} />
        <path d="M0 130 Q60 125 120 130 Q200 135 280 128" strokeWidth={4} />
      </svg>
      <div className="a-venue-pin" style={{ '--pin-color': pinColor } as React.CSSProperties}>
        <div className="head" />
      </div>
    </>
  );
}

export default function VenuesList({ venues, onAddVenue, onUpdateVenue, onDeleteVenue }: VenuesListProps) {
  const [view, setView] = useState<ViewMode>('grid');
  const [q, setQ] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [editing, setEditing] = useState<Venue | null | 'new'>(null);
  const [confirmDel, setConfirmDel] = useState<Venue | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setEditing(null); setConfirmDel(null); } }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const cities = useMemo(() => {
    const s = new Set<string>();
    venues.forEach(v => v.city && s.add(v.city));
    return [...s].sort();
  }, [venues]);

  const filtered = useMemo(() => {
    let list = venues;
    if (q.trim()) {
      const lq = q.toLowerCase();
      list = list.filter(v =>
        v.name.toLowerCase().includes(lq) ||
        (v.city || '').toLowerCase().includes(lq) ||
        (v.address || '').toLowerCase().includes(lq)
      );
    }
    if (cityFilter !== 'all') list = list.filter(v => v.city === cityFilter);
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [venues, q, cityFilter]);

  const IcEdit = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.12 2.12 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>;
  const IcTrash = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>;
  const IcPin = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-7-7.5-7-13a7 7 0 1 1 14 0c0 5.5-7 13-7 13Z"/><circle cx={12} cy={9} r={2.5}/></svg>;

  return (
    <div>
      <div className="a-topbar">
        <div className="a-topbar-head">
          <div>
            <h2>Venues</h2>
            <div className="a-topbar-sub">{filtered.length} venue{filtered.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="a-topbar-actions">
            <button className="a-btn a-btn-primary" onClick={() => setEditing('new')}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              New venue
            </button>
          </div>
        </div>

        <div className="a-toolbar">
          <div className="a-search">
            <svg className="a-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <circle cx={11} cy={11} r={7}/><path d="m20 20-3.5-3.5"/>
            </svg>
            <input placeholder="Search venues, city, address…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <button className={`a-chip${cityFilter === 'all' ? ' is-on' : ''}`} onClick={() => setCityFilter('all')}>
            All <span className="ct">{venues.length}</span>
          </button>
          {cities.map(c => (
            <button key={c} className={`a-chip${cityFilter === c ? ' is-on' : ''}`} onClick={() => setCityFilter(c)}>
              {c} <span className="ct">{venues.filter(v => v.city === c).length}</span>
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>View</span>
            <div className="a-viewswitch">
              {([
                { id: 'grid' as const, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={7} height={7} rx={1}/><rect x={14} y={3} width={7} height={7} rx={1}/><rect x={3} y={14} width={7} height={7} rx={1}/><rect x={14} y={14} width={7} height={7} rx={1}/></svg> },
                { id: 'rows' as const, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg> },
                { id: 'table' as const, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={18} height={18} rx={2}/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg> },
              ]).map(v => (
                <button key={v.id} className={view === v.id ? 'is-on' : ''} onClick={() => setView(v.id)}>{v.icon}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="a-body">
        {filtered.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-3)' }}>No venues found</div>
        )}

        {/* GRID */}
        {view === 'grid' && filtered.length > 0 && (
          <div className="a-venue-grid">
            {filtered.map(v => {
              const pinColor = colorFromName(v.name);
              const evCount = 0; // would need events passed in
              return (
                <div key={v.id} className="a-venue-card" onClick={() => setEditing(v)}>
                  <div className="a-venue-map">
                    <VenueMapPlaceholder pinColor={pinColor} />
                  </div>
                  <div className="a-venue-body">
                    <h3 className="a-venue-name">{v.name}</h3>
                    <div className="a-venue-addr">
                      <IcPin />
                      {v.address}{v.city ? `, ${v.city}` : ''}
                    </div>
                    {v.description && (
                      <p style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5, margin: '6px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.description}</p>
                    )}
                  </div>
                  <div className="a-venue-foot">
                    <span className="stat">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={5} width={18} height={16} rx={2}/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
                      <span className="num">{evCount}</span> events
                    </span>
                    <div style={{ display: 'flex', gap: 3 }} onClick={e => e.stopPropagation()}>
                      <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm" onClick={() => setEditing(v)}><IcEdit /></button>
                      <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm a-btn-danger" onClick={() => setConfirmDel(v)}><IcTrash /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ROWS */}
        {view === 'rows' && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(v => {
              const pinColor = colorFromName(v.name);
              return (
                <div key={v.id} className="a-venue-row" onClick={() => setEditing(v)} style={{ cursor: 'pointer' }}>
                  <div className="mini-map">
                    <VenueMapPlaceholder pinColor={pinColor} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p className="a-venue-row-name">{v.name}</p>
                    <div className="a-venue-row-meta"><IcPin />{v.address}{v.city ? `, ${v.city}` : ''}</div>
                    {v.description && <p className="a-venue-row-desc">{v.description}</p>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--ink-2)' }}>
                    {v.city && <span>{v.city}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 3 }} onClick={e => e.stopPropagation()}>
                    <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm" onClick={() => setEditing(v)}><IcEdit /></button>
                    <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm a-btn-danger" onClick={() => setConfirmDel(v)}><IcTrash /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TABLE */}
        {view === 'table' && filtered.length > 0 && (
          <div className="a-tbl-wrap">
            <table className="a-tbl">
              <thead>
                <tr>
                  <th>Venue</th>
                  <th>Address</th>
                  <th>City</th>
                  <th className="a-actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id} style={{ cursor: 'pointer' }} onClick={() => setEditing(v)}>
                    <td><div className="ev-title">{v.name}</div></td>
                    <td style={{ fontSize: 13, color: 'var(--ink-2)' }}>{v.address || '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--ink-2)' }}>{v.city || '—'}</td>
                    <td className="a-actions" onClick={e => e.stopPropagation()}>
                      <button className="a-btn a-btn-ghost a-btn-icon" onClick={() => setEditing(v)}><IcEdit /></button>
                      <button className="a-btn a-btn-ghost a-btn-icon a-btn-danger" onClick={() => setConfirmDel(v)}><IcTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Venue Drawer */}
      {editing !== null && (
        <>
          <div className="a-scrim" onClick={() => setEditing(null)} />
          <div className="a-drawer-shell">
            <div className="a-drawer-card">
              <VenueDrawerForm
                venue={editing === 'new' ? null : editing}
                onSave={(data) => {
                  if (editing === 'new') {
                    onAddVenue(data);
                  } else if (editing) {
                    onUpdateVenue({ ...editing, ...data });
                  }
                  setEditing(null);
                }}
                onClose={() => setEditing(null)}
                onDelete={editing !== 'new' && editing ? () => { setEditing(null); setConfirmDel(editing); } : undefined}
              />
            </div>
          </div>
        </>
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <>
          <div className="a-scrim" onClick={() => setConfirmDel(null)} />
          <div className="a-modal-shell">
            <div className="a-modal-card" style={{ maxWidth: 460 }}>
              <div className="a-form-head">
                <div className="a-form-head-l">
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>Confirm</div>
                    <h3>Remove venue?</h3>
                  </div>
                </div>
              </div>
              <div className="a-form-body">
                <p style={{ margin: 0, color: 'var(--ink-2)' }}>
                  Remove <strong style={{ color: 'var(--ink)' }}>"{confirmDel.name}"</strong>.
                  Past events at this venue are kept.
                </p>
              </div>
              <div className="a-form-foot">
                <span />
                <div className="a-form-foot-r">
                  <button className="a-btn a-btn-ghost" onClick={() => setConfirmDel(null)}>Cancel</button>
                  <button className="a-btn" style={{ background: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' }}
                    onClick={() => { onDeleteVenue(confirmDel.id); setConfirmDel(null); }}>
                    Remove venue
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

function VenueDrawerForm({ venue, onSave, onClose, onDelete }: {
  venue: Venue | null;
  onSave: (data: Partial<Venue>) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState<Partial<Venue>>({
    name: '', address: '', city: '', description: '', imageUrl: '', mapEmbedHtml: '',
  });

  useEffect(() => {
    setForm(venue ? {
      name: venue.name,
      address: venue.address,
      city: venue.city || '',
      description: venue.description || '',
      imageUrl: venue.imageUrl || '',
      mapEmbedHtml: venue.mapEmbedHtml || '',
    } : { name: '', address: '', city: '', description: '', imageUrl: '', mapEmbedHtml: '' });
  }, [venue]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  function set(key: keyof Venue, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="a-form-head">
        <div className="a-form-head-l">
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>
              {venue ? 'Venue' : 'New'}
            </div>
            <h3>{venue ? venue.name || 'Edit Venue' : 'New Venue'}</h3>
          </div>
        </div>
        <div className="a-form-head-r">
          <button type="button" className="a-btn a-btn-ghost a-btn-icon" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <div className="a-form-body">
        <div className="a-form-grid">
          <div className="a-field full">
            <label>Venue name <span className="req">*</span></label>
            <input className="a-input" required value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Warehouse 9" />
          </div>
          <div className="a-field">
            <label>Address</label>
            <input className="a-input" value={form.address || ''} onChange={e => set('address', e.target.value)} placeholder="Street address" />
          </div>
          <div className="a-field">
            <label>City</label>
            <input className="a-input" value={form.city || ''} onChange={e => set('city', e.target.value)} placeholder="Copenhagen" />
          </div>
          <div className="a-field full">
            <label>Description</label>
            <textarea className="a-textarea" value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Venue description…" rows={3} />
          </div>
          <div className="a-field full">
            <label>Image URL</label>
            <input className="a-input" value={form.imageUrl || ''} onChange={e => set('imageUrl', e.target.value)} placeholder="https://…" />
          </div>
          <div className="a-field full">
            <label>Google Maps embed <span className="hint" style={{ fontFamily: 'var(--font-ui)', fontSize: 11 }}>(iframe HTML)</span></label>
            <textarea className="a-textarea" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} value={form.mapEmbedHtml || ''} onChange={e => set('mapEmbedHtml', e.target.value)} placeholder={'<iframe src="https://maps.google.com/…" />'} rows={4} />
          </div>
        </div>
      </div>

      <div className="a-form-foot">
        <div>
          {onDelete && (
            <button type="button" className="a-btn a-btn-ghost a-btn-danger" onClick={onDelete}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              Delete
            </button>
          )}
        </div>
        <div className="a-form-foot-r">
          <button type="button" className="a-btn a-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="a-btn a-btn-primary">{venue ? 'Save changes' : 'Create venue'}</button>
        </div>
      </div>
    </form>
  );
}
