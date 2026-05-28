import React, { useState, useEffect, useMemo } from 'react';
import type { GalleryItem } from '../../types/admin';
import type { Event } from '../../services/api';
import { apiService } from '../../services/api';

interface GalleryListProps {
  gallery: GalleryItem[];
  onAddGallery: (galleryData: Omit<GalleryItem, 'id' | 'createdAt'>) => void;
  onUpdateGallery: (item: GalleryItem) => void;
  onDeleteGallery: (id: string) => void;
}

type ViewMode = 'masonry' | 'rows' | 'table';
type SortCol = 'updated' | 'filename' | 'category' | 'photographer';

const CATEGORIES = ['event', 'venue', 'artist', 'other'] as const;

function imgBg(url?: string): string {
  // deterministic placeholder color from url
  if (!url) return 'oklch(0.55 0.1 250)';
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (h * 31 + url.charCodeAt(i)) | 0;
  const hue = ((h % 360) + 360) % 360;
  return `oklch(0.55 0.1 ${hue})`;
}

function fmtDate(d: string): string {
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

export default function GalleryList({ gallery, onAddGallery, onUpdateGallery, onDeleteGallery }: GalleryListProps) {
  const [view, setView] = useState<ViewMode>('masonry');
  const [q, setQ] = useState('');
  const [pubFilter, setPubFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [sort, _setSort] = useState<{ col: SortCol; dir: 'asc' | 'desc' }>({ col: 'updated', dir: 'desc' });
  const [editing, setEditing] = useState<GalleryItem | null | 'new'>(null);
  const [confirmDel, setConfirmDel] = useState<GalleryItem | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyUrl(g: GalleryItem) {
    const url = g.url || g.thumbnailUrl || '';
    if (!url) return;
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedId(g.id);
      setTimeout(() => setCopiedId(c => c === g.id ? null : c), 1500);
    });
  }

  useEffect(() => {
    apiService.getEvents().then(r => { if (r.data) setEvents(r.data); }).catch(() => { /* noop */ });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setEditing(null); setConfirmDel(null); } }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const filtered = useMemo(() => {
    let list = gallery;
    if (q.trim()) {
      const lq = q.toLowerCase();
      list = list.filter(g =>
        g.filename.toLowerCase().includes(lq) ||
        (g.caption || '').toLowerCase().includes(lq) ||
        (g.photographer || '').toLowerCase().includes(lq)
      );
    }
    if (pubFilter === 'published') list = list.filter(g => g.isPublished);
    if (pubFilter === 'draft') list = list.filter(g => !g.isPublished);
    if (catFilter !== 'all') list = list.filter(g => g.category === catFilter);
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sort.col === 'filename') return a.filename.localeCompare(b.filename) * dir;
      if (sort.col === 'category') return a.category.localeCompare(b.category) * dir;
      if (sort.col === 'photographer') return (a.photographer || '').localeCompare(b.photographer || '') * dir;
      return (a.updatedAt || '').localeCompare(b.updatedAt || '') * dir;
    });
  }, [gallery, q, pubFilter, catFilter, sort]);

  const counts = useMemo(() => ({
    all: gallery.length,
    published: gallery.filter(g => g.isPublished).length,
    draft: gallery.filter(g => !g.isPublished).length,
  }), [gallery]);

  function handleSave(data: Omit<GalleryItem, 'id' | 'createdAt'>) {
    if (editing === 'new') {
      onAddGallery(data);
    } else if (editing && editing !== 'new') {
      onUpdateGallery({ ...editing, ...data });
    }
    setEditing(null);
  }

  const IcEdit = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.12 2.12 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>;
  const IcTrash = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>;
  const IcCopy = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x={9} y={9} width={13} height={13} rx={2}/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
  const IcCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

  return (
    <div>
      <div className="a-topbar">
        <div className="a-topbar-head">
          <div>
            <h2>Gallery</h2>
            <div className="a-topbar-sub">
              {counts.all} photo{counts.all !== 1 ? 's' : ''} · {counts.published} published · {counts.draft} draft
            </div>
          </div>
          <div className="a-topbar-actions">
            <button className="a-btn a-btn-primary" onClick={() => setEditing('new')}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Upload photo
            </button>
          </div>
        </div>

        <div className="a-toolbar">
          <div className="a-search">
            <svg className="a-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><circle cx={11} cy={11} r={7}/><path d="m20 20-3.5-3.5"/></svg>
            <input placeholder="Search filename, caption, photographer…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'published', 'draft'] as const).map(s => (
              <button key={s} className={`a-chip${pubFilter === s ? ' is-on' : ''}`} onClick={() => setPubFilter(s)}>
                {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
                <span className="ct">{counts[s]}</span>
              </button>
            ))}
          </div>
          <div className="a-divider" />
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={`a-chip${catFilter === 'all' ? ' is-on' : ''}`} onClick={() => setCatFilter('all')}>All</button>
            {CATEGORIES.map(c => (
              <button key={c} className={`a-chip${catFilter === c ? ' is-on' : ''}`} onClick={() => setCatFilter(c)}>
                {c}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>View</span>
            <div className="a-viewswitch">
              {([
                { id: 'masonry' as const, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={7} height={7} rx={1}/><rect x={14} y={3} width={7} height={7} rx={1}/><rect x={3} y={14} width={7} height={7} rx={1}/><rect x={14} y={14} width={7} height={7} rx={1}/></svg> },
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
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-3)' }}>No photos found</div>
        )}

        {/* MASONRY */}
        {view === 'masonry' && filtered.length > 0 && (
          <div className="a-masonry">
            {filtered.map(g => {
              const bg = imgBg(g.url);
              const isImg = !!(g.url || g.thumbnailUrl);
              return (
                <div key={g.id} className="a-gal-tile">
                  <div className="a-gal-img" style={{ '--img-bg': bg, minHeight: 120 } as React.CSSProperties}>
                    {isImg && <img src={g.thumbnailUrl || g.url} alt={g.caption || g.filename} loading="lazy" />}
                    {g.photographer && <div className="ph-tag">{g.photographer}</div>}
                    <div className="cat-tag">{g.category}</div>
                    {!g.isPublished && <div className="draft-tag">Draft</div>}
                    <div className="a-gal-overlay">
                      <div className="overlay-actions">
                        <button onClick={() => setEditing(g)} title="Edit"><IcEdit /></button>
                        <button
                          title={copiedId === g.id ? 'Copied!' : 'Copy image URL'}
                          onClick={e => { e.stopPropagation(); copyUrl(g); }}
                          style={copiedId === g.id ? { color: 'var(--ok)' } : undefined}
                        >
                          {copiedId === g.id ? <IcCheck /> : <IcCopy />}
                        </button>
                        <button className="danger" onClick={() => setConfirmDel(g)} title="Delete"><IcTrash /></button>
                      </div>
                      {g.caption && <div className="caption">{g.caption}</div>}
                      <div className="meta">{g.filename}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ROWS */}
        {view === 'rows' && filtered.length > 0 && (
          <div className="a-gal-rows">
            {filtered.map(g => {
              const bg = imgBg(g.url);
              const ev = events.find(e => e.id === g.eventId);
              return (
                <div key={g.id} className="a-gal-row">
                  <div className="thumb" style={{ '--img-bg': bg } as React.CSSProperties}>
                    {(g.url || g.thumbnailUrl) && <img src={g.thumbnailUrl || g.url} alt={g.filename} loading="lazy" />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="filename">{g.filename}</div>
                    {g.caption && <div className="caption-line">{g.caption}</div>}
                  </div>
                  <div className="who">
                    {g.photographer && <span>{g.photographer}</span>}
                    {ev && <span style={{ color: 'var(--ink-3)' }}>{ev.title}</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span className="a-cat-pill">{g.category}</span>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{g.isPublished ? '✓ published' : 'draft'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 3 }}>
                    <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm" onClick={() => setEditing(g)}><IcEdit /></button>
                    <button
                      className="a-btn a-btn-ghost a-btn-icon a-btn-sm"
                      title={copiedId === g.id ? 'Copied!' : 'Copy image URL'}
                      onClick={() => copyUrl(g)}
                      style={copiedId === g.id ? { color: 'var(--ok)' } : undefined}
                    >
                      {copiedId === g.id ? <IcCheck /> : <IcCopy />}
                    </button>
                    <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm a-btn-danger" onClick={() => setConfirmDel(g)}><IcTrash /></button>
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
                  <th style={{ paddingLeft: 100 }}>File</th>
                  <th>Category</th>
                  <th>Photographer</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th className="a-actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(g => {
                  const bg = imgBg(g.url);
                  return (
                    <tr key={g.id} style={{ cursor: 'pointer' }} onClick={() => setEditing(g)}>
                      <td style={{ paddingLeft: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16 }}>
                          <div style={{ width: 64, height: 44, borderRadius: 4, flexShrink: 0, background: `repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 8px), ${bg}`, overflow: 'hidden', position: 'relative' }}>
                            {g.thumbnailUrl && <img src={g.thumbnailUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                          </div>
                          <div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>{g.filename}</div>
                            {g.caption && <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{g.caption}</div>}
                          </div>
                        </div>
                      </td>
                      <td><span className="a-cat-pill">{g.category}</span></td>
                      <td style={{ fontSize: 13, color: 'var(--ink-2)' }}>{g.photographer || '—'}</td>
                      <td>
                        <span className={`a-pill ${g.isPublished ? 'a-pill-upcoming' : 'a-pill-draft'}`}>
                          {g.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{fmtDate(g.updatedAt)}</td>
                      <td className="a-actions" onClick={e => e.stopPropagation()}>
                        <button className="a-btn a-btn-ghost a-btn-icon" onClick={() => setEditing(g)}><IcEdit /></button>
                        <button
                          className="a-btn a-btn-ghost a-btn-icon"
                          title={copiedId === g.id ? 'Copied!' : 'Copy image URL'}
                          onClick={() => copyUrl(g)}
                          style={copiedId === g.id ? { color: 'var(--ok)' } : undefined}
                        >
                          {copiedId === g.id ? <IcCheck /> : <IcCopy />}
                        </button>
                        <button className="a-btn a-btn-ghost a-btn-icon a-btn-danger" onClick={() => setConfirmDel(g)}><IcTrash /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gallery drawer form */}
      {editing !== null && (
        <>
          <div className="a-scrim" onClick={() => setEditing(null)} />
          <div className="a-drawer-shell">
            <div className="a-drawer-card">
              <GalleryDrawerForm
                item={editing === 'new' ? null : editing}
                events={events}
                onSave={handleSave}
                onClose={() => setEditing(null)}
                onDelete={editing !== 'new' && editing ? () => { setConfirmDel(editing); setEditing(null); } : undefined}
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
                    <h3>Delete photo?</h3>
                  </div>
                </div>
              </div>
              <div className="a-form-body">
                <p style={{ margin: 0, color: 'var(--ink-2)' }}>
                  Delete <strong style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{confirmDel.filename}</strong>.
                  The file in storage isn't touched.
                </p>
              </div>
              <div className="a-form-foot">
                <span />
                <div className="a-form-foot-r">
                  <button className="a-btn a-btn-ghost" onClick={() => setConfirmDel(null)}>Cancel</button>
                  <button className="a-btn" style={{ background: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' }}
                    onClick={() => { onDeleteGallery(confirmDel.id); setConfirmDel(null); }}>
                    Delete
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

function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  if (!url) return null;
  return (
    <button
      type="button"
      className="a-btn a-btn-ghost a-btn-icon"
      title={copied ? 'Copied!' : 'Copy URL'}
      style={copied ? { color: 'var(--ok)' } : undefined}
      onClick={() => {
        void navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied
        ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x={9} y={9} width={13} height={13} rx={2}/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      }
    </button>
  );
}

function GalleryDrawerForm({ item, events, onSave, onClose, onDelete }: {
  item: GalleryItem | null;
  events: Event[];
  onSave: (data: Omit<GalleryItem, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState({
    filename: '', url: '', thumbnailUrl: '', mediumUrl: '', largeUrl: '',
    caption: '', photographer: '', category: 'event' as GalleryItem['category'],
    eventId: '', isPublished: false, orderIndex: 0, tags: [] as string[],
    updatedAt: new Date().toISOString(),
  });

  useEffect(() => {
    if (item) {
      setForm({
        filename: item.filename,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl || '',
        mediumUrl: item.mediumUrl || '',
        largeUrl: item.largeUrl || '',
        caption: item.caption || '',
        photographer: item.photographer || '',
        category: item.category,
        eventId: item.eventId || '',
        isPublished: item.isPublished,
        orderIndex: item.orderIndex,
        tags: item.tags ?? [],
        updatedAt: item.updatedAt,
      });
    }
  }, [item]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { ...data } = form;
    onSave({ ...data, eventId: data.eventId || null, updatedAt: new Date().toISOString() });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="a-form-head">
        <div className="a-form-head-l">
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>
              {item ? 'Gallery' : 'New Photo'}
            </div>
            <h3>{item ? item.filename : 'Upload Photo'}</h3>
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
            <label>Filename <span className="req">*</span></label>
            <input className="a-input" required value={form.filename} onChange={e => setForm(f => ({ ...f, filename: e.target.value }))} placeholder="photo.jpg" />
          </div>
          <div className="a-field full">
            <label>URL</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input className="a-input" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://…" style={{ flex: 1 }} />
              <CopyUrlButton url={form.url} />
            </div>
          </div>
          <div className="a-field full">
            <label>Caption</label>
            <textarea className="a-textarea" value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} placeholder="Caption…" rows={2} />
          </div>
          <div className="a-field">
            <label>Photographer</label>
            <input className="a-input" value={form.photographer} onChange={e => setForm(f => ({ ...f, photographer: e.target.value }))} placeholder="Name" />
          </div>
          <div className="a-field">
            <label>Category</label>
            <select className="a-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as GalleryItem['category'] }))}>
              {(['event', 'venue', 'artist', 'other'] as const).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="a-field full">
            <label>Event</label>
            <select className="a-select" value={form.eventId} onChange={e => setForm(f => ({ ...f, eventId: e.target.value }))}>
              <option value="">Not linked</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          </div>
          <div className="a-field full">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>
              <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} />
              Published (visible on site)
            </label>
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
          <button type="submit" className="a-btn a-btn-primary">{item ? 'Save changes' : 'Add photo'}</button>
        </div>
      </div>
    </form>
  );
}
