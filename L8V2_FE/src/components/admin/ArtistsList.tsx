import { useState, useMemo } from 'react';
import type { Artist } from '../../types/admin';
import ArtistFormModal, { emptyArtistDraft } from './ArtistFormModal';

interface ArtistsListProps {
  artists: Artist[];
  onAddArtist: (artistData: Omit<Artist, 'id' | 'createdAt'>) => void;
  onUpdateArtist: (artist: Artist) => void;
  onDeleteArtist: (id: string) => void;
}

type ViewMode = 'grid' | 'rows' | 'table';
type SortCol = 'name' | 'genre' | 'bookable';

function colorFromName(name: string): string {
  if (!name) return 'oklch(0.55 0.05 250)';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = Math.trunc(h * 31 + name.charCodeAt(i));
  const hue = ((h % 360) + 360) % 360;
  return `oklch(0.55 0.14 ${hue})`;
}

function monogram(name: string): string {
  if (!name) return '·';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ArtistsList({ artists, onAddArtist, onUpdateArtist, onDeleteArtist }: ArtistsListProps) {
  const [view, setView] = useState<ViewMode>('grid');
  const [q, setQ] = useState('');
  const [bookFilter, setBookFilter] = useState('all');
  const [sort, setSort] = useState<{ col: SortCol; dir: 'asc' | 'desc' }>({ col: 'name', dir: 'asc' });
  const [editing, setEditing] = useState<Artist | null | 'new'>(null);
  const [confirmDel, setConfirmDel] = useState<Artist | null>(null);
  const [newArtistDraft, setNewArtistDraft] = useState(emptyArtistDraft);

  function handleSort(col: SortCol) {
    setSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  }

  const filtered = useMemo(() => {
    let list = artists;
    if (q.trim()) {
      const lq = q.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(lq) ||
        (a.genre || '').toLowerCase().includes(lq) ||
        (a.bio || '').toLowerCase().includes(lq)
      );
    }
    if (bookFilter === 'bookable') list = list.filter(a => a.isBookable);
    if (bookFilter === 'off-roster') list = list.filter(a => !a.isBookable);
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sort.col === 'genre') return (a.genre || '').localeCompare(b.genre || '') * dir;
      if (sort.col === 'bookable') return (Number(a.isBookable) - Number(b.isBookable)) * dir;
      return a.name.localeCompare(b.name) * dir;
    });
  }, [artists, q, bookFilter, sort]);

  const counts = useMemo(() => ({
    all: artists.length,
    bookable: artists.filter(a => a.isBookable).length,
    'off-roster': artists.filter(a => !a.isBookable).length,
  }), [artists]);

  function handleSave(saved: Artist) {
    if (editing === 'new') {
      onAddArtist(saved);
      setNewArtistDraft(emptyArtistDraft);
    } else if (editing) {
      onUpdateArtist(saved);
    }
    setEditing(null);
  }

  const editingArtist: Artist | null = editing === 'new' ? null : (editing ?? null);

  const IcEdit = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.12 2.12 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/>
    </svg>
  );
  const IcTrash = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    </svg>
  );

  return (
    <div>
      <div className="a-topbar">
        <div className="a-topbar-head">
          <div>
            <h2>Artists</h2>
            <div className="a-topbar-sub">
              {counts.all} on roster · {counts.bookable} bookable · {counts['off-roster']} off-roster
            </div>
          </div>
          <div className="a-topbar-actions">
            <button className="a-btn a-btn-primary" onClick={() => setEditing('new')}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              New artist
            </button>
          </div>
        </div>

        <div className="a-toolbar">
          <div className="a-search">
            <svg className="a-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <circle cx={11} cy={11} r={7}/><path d="m20 20-3.5-3.5"/>
            </svg>
            <input placeholder="Search artists, genre, bio…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'bookable', 'off-roster'] as const).map(s => (
              <button key={s} className={`a-chip${bookFilter === s ? ' is-on' : ''}`} onClick={() => setBookFilter(s)}>
                {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
                <span className="ct">{counts[s]}</span>
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>View</span>
            <div className="a-viewswitch">
              {([
                { id: 'grid' as const, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={7} height={7} rx={1}/><rect x={14} y={3} width={7} height={7} rx={1}/><rect x={3} y={14} width={7} height={7} rx={1}/><rect x={14} y={14} width={7} height={7} rx={1}/></svg> },
                { id: 'rows' as const, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg> },
                { id: 'table' as const, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={18} height={18} rx={2}/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg> },
              ]).map(v => (
                <button key={v.id} className={view === v.id ? 'is-on' : ''} onClick={() => setView(v.id)}>
                  {v.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="a-body">
        {filtered.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-3)' }}>No artists found</div>
        )}

        {/* GRID */}
        {view === 'grid' && filtered.length > 0 && (
          <div className="a-art-grid">
            {filtered.map(a => {
              const bg = colorFromName(a.name);
              const mono = monogram(a.name);
              return (
                <div key={a.id} className="a-art-card" onClick={() => setEditing(a)}>
                  <div className="a-art-photo" style={{ '--photo-bg': bg } as React.CSSProperties}>
                    {a.imageUrl ? <img src={a.imageUrl} alt={a.name} /> : mono}
                    <div className={`book-badge${a.isBookable ? '' : ' off'}`}>
                      <span className="dot" />
                      {a.isBookable ? 'Bookable' : 'Off-roster'}
                    </div>
                  </div>
                  <div className="a-art-body">
                    <h3 className="a-art-name">{a.name}</h3>
                    {a.genre && <p className="a-art-genre">{a.genre}</p>}
                    {a.bio && <p style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.bio}</p>}
                  </div>
                  <div className="a-art-foot">
                    <span className="stat">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={5} width={18} height={16} rx={2}/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
                      {a.isBookable ? 'Available' : 'Not bookable'}
                    </span>
                    <div style={{ display: 'flex', gap: 3 }} onClick={e => e.stopPropagation()}>
                      <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm" onClick={() => setEditing(a)}><IcEdit /></button>
                      <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm a-btn-danger" onClick={() => setConfirmDel(a)}><IcTrash /></button>
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
            {filtered.map(a => {
              const bg = colorFromName(a.name);
              const mono = monogram(a.name);
              return (
                <div key={a.id} className="a-art-row" onClick={() => setEditing(a)} style={{ cursor: 'pointer' }}>
                  <div className="a-art-row-photo" style={{ '--photo-bg': bg } as React.CSSProperties}>
                    {a.imageUrl ? <img src={a.imageUrl} alt={a.name} /> : mono}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p className="a-art-row-name">{a.name}</p>
                    <div className="a-art-row-meta">
                      {a.genre && <span>{a.genre}</span>}
                      <span className={`a-pill ${a.isBookable ? 'a-pill-upcoming' : 'a-pill-draft'}`}>
                        {a.isBookable ? 'Bookable' : 'Off-roster'}
                      </span>
                    </div>
                    {a.bio && <p className="a-art-row-bio">{a.bio}</p>}
                  </div>
                  <div className="a-art-row-stats">
                    {a.bookingUser && (
                      <span className="stat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><circle cx={12} cy={8} r={4}/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
                        <span>Manager:</span> <span className="num">{[a.bookingUser.firstName, a.bookingUser.lastName].filter(Boolean).join(' ') || a.bookingUser.email}</span>
                      </span>
                    )}
                  </div>
                  <div className="a-art-row-side" onClick={e => e.stopPropagation()}>
                    <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm" onClick={() => setEditing(a)}><IcEdit /></button>
                    <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm a-btn-danger" onClick={() => setConfirmDel(a)}><IcTrash /></button>
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
                  <th onClick={() => handleSort('name')} style={{ paddingLeft: 60 }}>
                    Artist {sort.col === 'name' && <span>{sort.dir === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                  <th onClick={() => handleSort('genre')}>Genre</th>
                  <th onClick={() => handleSort('bookable')}>Status</th>
                  <th>Manager</th>
                  <th className="a-actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const bg = colorFromName(a.name);
                  const mono = monogram(a.name);
                  return (
                    <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setEditing(a)}>
                      <td style={{ paddingLeft: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16 }}>
                          <div className="a-art-mono" style={{ '--photo-bg': bg } as React.CSSProperties}>
                            {a.imageUrl ? <img src={a.imageUrl} alt={a.name} /> : mono}
                          </div>
                          <div className="ev-title">{a.name}</div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--ink-2)', fontSize: 13 }}>{a.genre || '—'}</td>
                      <td><span className={`a-pill ${a.isBookable ? 'a-pill-upcoming' : 'a-pill-draft'}`}>{a.isBookable ? 'Bookable' : 'Off-roster'}</span></td>
                      <td style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                        {a.bookingUser ? [a.bookingUser.firstName, a.bookingUser.lastName].filter(Boolean).join(' ') || a.bookingUser.email : '—'}
                      </td>
                      <td className="a-actions" onClick={e => e.stopPropagation()}>
                        <button className="a-btn a-btn-ghost a-btn-icon" onClick={() => setEditing(a)}><IcEdit /></button>
                        <button className="a-btn a-btn-ghost a-btn-icon a-btn-danger" onClick={() => setConfirmDel(a)}><IcTrash /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Artist form modal */}
      {editing !== null && (
        <ArtistFormModal
          artist={editingArtist}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          draft={editing === 'new' ? newArtistDraft : undefined}
          onDraftChange={editing === 'new' ? setNewArtistDraft : undefined}
        />
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
                    <h3>Remove artist?</h3>
                  </div>
                </div>
              </div>
              <div className="a-form-body">
                <p style={{ margin: 0, color: 'var(--ink-2)' }}>
                  Remove <strong style={{ color: 'var(--ink)' }}>"{confirmDel.name}"</strong> from the roster.
                  Past events featuring this artist are kept.
                </p>
              </div>
              <div className="a-form-foot">
                <span />
                <div className="a-form-foot-r">
                  <button className="a-btn a-btn-ghost" onClick={() => setConfirmDel(null)}>Cancel</button>
                  <button className="a-btn" style={{ background: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' }}
                    onClick={() => { onDeleteArtist(confirmDel.id); setConfirmDel(null); }}>
                    Remove
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
