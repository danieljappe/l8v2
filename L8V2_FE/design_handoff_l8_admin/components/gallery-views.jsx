// Gallery views: masonry, rows, table. Schema-aligned.
// Placeholder tile color is derived from filename (no DB field for color).
const { I, colorFromName } = window;

// Deterministic aspect ratio per filename so masonry has visual variety,
// but stays stable across renders. Real photos would use their natural size.
function aspectFromFilename(name) {
  if (!name) return 1;
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const ratios = [0.7, 0.75, 1.0, 1.0, 1.25, 1.33, 1.5]; // tall through wide
  return ratios[Math.abs(h) % ratios.length];
}

function GalleryActions({ item, onEdit, onDelete, onTogglePub }) {
  return (
    <>
      <button
        title={item.isPublished ? 'Unpublish' : 'Publish'}
        onClick={(e) => { e.stopPropagation(); onTogglePub(item); }}
      >
        <I name={item.isPublished ? 'eye' : 'eye'} size={13} />
      </button>
      <button title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
        <I name="edit" size={13} />
      </button>
      <button title="Delete" className="danger" onClick={(e) => { e.stopPropagation(); onDelete(item); }}>
        <I name="trash" size={13} />
      </button>
    </>
  );
}

// ── MASONRY ────────────────────────────────────────────────
function GalleryMasonryView({ items, onEdit, onDelete, onTogglePub, onOpen }) {
  if (items.length === 0) {
    return <div className="empty"><h3 className="ttl">No photos match.</h3><p>Adjust filters or upload a new photo.</p></div>;
  }
  return (
    <div className="gal-masonry">
      {items.map(g => {
        const ratio = aspectFromFilename(g.filename);
        return (
          <article
            className="gal-tile"
            key={g.id}
            onClick={() => onOpen(g)}
          >
            <div
              className="gal-img"
              style={{
                '--img-bg': colorFromName(g.filename),
                aspectRatio: ratio,
              }}
            >
              <div className="ph-tag">[ photo ]</div>
              <div className="cat-tag">{g.category}</div>
              {!g.isPublished && <div className="draft-tag">Draft</div>}
            </div>
            <div className="gal-overlay">
              <div className="actions">
                <GalleryActions item={g} onEdit={onEdit} onDelete={onDelete} onTogglePub={onTogglePub} />
              </div>
              {g.caption && <p className="caption">{g.caption}</p>}
              <div className="meta">
                {g.photographer && <span>{g.photographer}</span>}
                {g.photographer && g.eventId && <span>·</span>}
                {g.eventId && <span>{window.eventById(g.eventId)?.title || `event #${g.eventId}`}</span>}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

// ── ROWS ───────────────────────────────────────────────────
function GalleryRowsView({ items, onEdit, onDelete, onTogglePub, onOpen }) {
  if (items.length === 0) {
    return <div className="empty"><h3 className="ttl">No photos match.</h3><p>Adjust filters or upload a new photo.</p></div>;
  }
  return (
    <div className="gal-rows">
      {items.map(g => {
        const ev = g.eventId ? window.eventById(g.eventId) : null;
        return (
          <article className="gal-row" key={g.id} onClick={() => onOpen(g)}>
            <div className="thumb" style={{ '--img-bg': colorFromName(g.filename) }}>
              {!g.isPublished && (
                <div style={{
                  position: 'absolute', top: 4, left: 4,
                  background: 'rgba(255,200,80,0.95)', color: '#1a1408',
                  fontFamily: 'var(--font-mono)', fontSize: 8.5, padding: '2px 5px',
                  borderRadius: 2, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                }}>Draft</div>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <h4 className="filename">{g.filename}</h4>
              <div className="caption-line">
                {g.caption || <span style={{ color: 'var(--ink-3)' }}>No caption.</span>}
              </div>
            </div>
            <div className="who">
              <span className="ph">{g.photographer || <span style={{ color: 'var(--ink-3)' }}>—</span>}</span>
              {ev && <span className="ev">{ev.title}</span>}
              {!ev && <span className="ev" style={{ color: 'var(--ink-3)' }}>No event linked</span>}
            </div>
            <div>
              <span className="cat-pill">{g.category}</span>
            </div>
            <div className="row-actions" onClick={(e) => e.stopPropagation()}>
              <button
                className="btn btn-ghost btn-icon"
                title={g.isPublished ? 'Unpublish' : 'Publish'}
                onClick={() => onTogglePub(g)}
              >
                <I name="eye" />
              </button>
              <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => onEdit(g)}>
                <I name="edit" />
              </button>
              <button className="btn btn-ghost btn-icon btn-danger" title="Delete" onClick={() => onDelete(g)}>
                <I name="trash" />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

// ── TABLE ──────────────────────────────────────────────────
function GalleryTableView({ items, sort, onSort, onEdit, onDelete, onTogglePub, onOpen }) {
  const cols = [
    { id: 'filename', label: 'File' },
    { id: 'category', label: 'Category' },
    { id: 'photographer', label: 'Photographer' },
    { id: 'event', label: 'Event' },
    { id: 'published', label: 'Status' },
    { id: 'updated', label: 'Updated' },
    { id: 'actions', label: '', sortable: false },
  ];
  const SortIcon = ({ id }) => {
    if (sort.col !== id) return <span className="sort"><I name="chevron-down" size={11} /></span>;
    return <span className="sort"><I name={sort.dir === 'asc' ? 'sort-asc' : 'sort-desc'} size={12} /></span>;
  };
  return (
    <div className="tbl-wrap art-table">
      <table className="tbl">
        <thead>
          <tr>
            {cols.map(c => (
              <th
                key={c.id}
                className={sort.col === c.id ? 'is-sorted' : ''}
                onClick={() => c.sortable !== false && onSort(c.id)}
                style={c.id === 'actions' ? { textAlign: 'right' } : {}}
              >
                {c.label}
                {c.sortable !== false && c.label && <SortIcon id={c.id} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(g => {
            const ev = g.eventId ? window.eventById(g.eventId) : null;
            return (
              <tr key={g.id} onClick={() => onOpen(g)}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 32,
                      borderRadius: 'var(--r-sm)',
                      background: colorFromName(g.filename),
                      flexShrink: 0,
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      {!g.isPublished && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'rgba(0,0,0,0.35)',
                          display: 'grid', placeItems: 'center',
                          fontFamily: 'var(--font-mono)', fontSize: 8, color: 'white',
                          letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
                        }}>Draft</div>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 500 }}>{g.filename}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.caption || <span style={{ fontStyle: 'italic' }}>No caption</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td><span className="cat-pill">{g.category}</span></td>
                <td>
                  <span style={{ fontSize: 13 }}>{g.photographer || <span style={{ color: 'var(--ink-3)' }}>—</span>}</span>
                </td>
                <td>
                  {ev ? (
                    <span style={{ fontSize: 13 }}>{ev.title}</span>
                  ) : <span style={{ color: 'var(--ink-3)' }}>—</span>}
                </td>
                <td>
                  <span className={`bookable-pill ${g.isPublished ? '' : 'off'}`}>
                    {g.isPublished ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>
                    {g.updatedAt ? window.fmtDate(g.updatedAt) : '—'}
                  </span>
                </td>
                <td className="actions" onClick={(e) => e.stopPropagation()}>
                  <div className="row-actions">
                    <button
                      className="btn btn-ghost btn-icon"
                      title={g.isPublished ? 'Unpublish' : 'Publish'}
                      onClick={() => onTogglePub(g)}
                    >
                      <I name="eye" />
                    </button>
                    <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => onEdit(g)}>
                      <I name="edit" />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-danger" title="Delete" onClick={() => onDelete(g)}>
                      <I name="trash" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── LIGHTBOX ───────────────────────────────────────────────
function GalleryLightbox({ open, item, onClose, onEdit, onDelete, onTogglePub }) {
  if (!item) {
    return (
      <>
        <div className={`scrim ${open ? 'is-open' : ''}`} onClick={onClose} />
        <div className={`gal-lightbox-shell ${open ? 'is-open' : ''}`} />
      </>
    );
  }
  const ev = item.eventId ? window.eventById(item.eventId) : null;
  return (
    <>
      <div className={`scrim ${open ? 'is-open' : ''}`} onClick={onClose} />
      <div className={`gal-lightbox-shell ${open ? 'is-open' : ''}`}>
        <div className="gal-lightbox">
          <div className="gal-lb-img" style={{ '--img-bg': colorFromName(item.filename) }}>
            <div>[ {item.url} ]</div>
          </div>
          <div className="gal-lb-side">
            <div className="lb-head">
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.filename}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{item.uuid}</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={onClose}><I name="x" /></button>
            </div>
            <div className="lb-body">
              <div className="field-block">
                <label>Caption</label>
                <div className="v">{item.caption || <span style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>No caption</span>}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="field-block">
                  <label>Photographer</label>
                  <div className="v">{item.photographer || <span style={{ color: 'var(--ink-3)' }}>—</span>}</div>
                </div>
                <div className="field-block">
                  <label>Category</label>
                  <div className="v"><span className="cat-pill">{item.category}</span></div>
                </div>
              </div>
              <div className="field-block">
                <label>Linked event</label>
                <div className="v">
                  {ev
                    ? <span>{ev.title} <span style={{ color: 'var(--ink-3)' }}>· {window.fmtDate(ev.date)}</span></span>
                    : <span style={{ color: 'var(--ink-3)' }}>Not linked to any event</span>}
                </div>
              </div>
              <div className="field-block">
                <label>Status</label>
                <div className="v">
                  <span className={`bookable-pill ${item.isPublished ? '' : 'off'}`}>
                    {item.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="field-block">
                  <label>Created</label>
                  <div className="v mono">{window.fmtDate(item.createdAt)}</div>
                </div>
                <div className="field-block">
                  <label>Updated</label>
                  <div className="v mono">{window.fmtDate(item.updatedAt)}</div>
                </div>
              </div>
              <div className="field-block">
                <label>URL</label>
                <div className="v mono" style={{ fontSize: 11.5, color: 'var(--ink-3)', wordBreak: 'break-all' }}>{item.url}</div>
              </div>
            </div>
            <div className="lb-foot">
              <button className="btn btn-ghost" onClick={() => onTogglePub(item)}>
                <I name="eye" /> {item.isPublished ? 'Unpublish' : 'Publish'}
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-danger" onClick={() => onDelete(item)}>
                  <I name="trash" />
                </button>
                <button className="btn btn-primary" onClick={() => onEdit(item)}>
                  <I name="edit" /> Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, {
  GalleryMasonryView, GalleryRowsView, GalleryTableView, GalleryLightbox,
});
