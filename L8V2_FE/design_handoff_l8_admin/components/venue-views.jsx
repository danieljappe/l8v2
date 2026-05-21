// Venue views: grid (cards with stylized map), table, rows.
// Only DB schema fields are rendered; placeholder color is derived from name.
const { I, colorFromName } = window;

// Stylized map placeholder — deterministic per venue (by uuid/id+name) so each looks distinct.
function MapPlaceholder({ venue, mini = false }) {
  const seed = ((venue.id || 1) * 17) + (venue.name?.length || 1);
  const rand = (i) => {
    const x = Math.sin(seed + i * 13) * 10000;
    return x - Math.floor(x);
  };
  const w = 100, h = 60;
  const roads = [];
  for (let i = 0; i < 3; i++) {
    const y1 = 8 + rand(i) * (h - 16);
    const y2 = 8 + rand(i + 5) * (h - 16);
    const cx = 10 + rand(i + 9) * (w - 20);
    const cy = 10 + rand(i + 11) * (h - 20);
    roads.push(`M -5 ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${(w + 5).toFixed(1)} ${y2.toFixed(1)}`);
  }
  const vx = 20 + rand(20) * (w - 40);
  roads.push(`M ${vx.toFixed(1)} -5 L ${(vx + (rand(21) - 0.5) * 10).toFixed(1)} ${(h + 5).toFixed(1)}`);
  const pinColor = colorFromName(venue.name);
  return (
    <>
      <div className="grid-bg" />
      <svg className="roads" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {roads.map((d, i) => (
          <path key={i} d={d} strokeWidth={i === roads.length - 1 ? 1.2 : 0.7} />
        ))}
      </svg>
      <div className="venue-pin" style={{ '--pin-color': pinColor }}>
        <div className="head" />
        <div className="ring" />
      </div>
      {!mini && <div className="map-tag">[ map placeholder ]</div>}
    </>
  );
}

function VenueActions({ venue, onEdit, onDelete }) {
  return (
    <div className="row-actions">
      <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => onEdit(venue)}>
        <I name="edit" />
      </button>
      <button className="btn btn-ghost btn-icon btn-danger" title="Delete" onClick={() => onDelete(venue)}>
        <I name="trash" />
      </button>
    </div>
  );
}

// Extract iframe src from a stored mapEmbedHtml, if any.
function extractMapSrc(html) {
  if (!html) return null;
  const m = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

// ── GRID ───────────────────────────────────────────────────
function VenueGridView({ venues, onEdit, onDelete }) {
  if (venues.length === 0) {
    return <div className="empty"><h3 className="ttl">No venues match.</h3><p>Adjust filters or add a new venue.</p></div>;
  }
  return (
    <div className="venue-grid">
      {venues.map(v => {
        const total = window.eventCountForVenue(v.id);
        const upcoming = window.upcomingCountForVenue(v.id);
        const src = extractMapSrc(v.mapEmbedHtml);
        return (
          <article className="venue-card" key={v.id} onClick={() => onEdit(v)}>
            <div className="venue-map">
              {src ? (
                <iframe
                  src={src}
                  title={`${v.name} map`}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, pointerEvents: 'none' }}
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <MapPlaceholder venue={v} />
              )}
            </div>
            <div className="venue-body">
              <h3 className="venue-name">{v.name}</h3>
              <div className="venue-addr">
                <I name="pin" />
                <span>{v.address}{v.city ? `, ${v.city}` : ''}</span>
              </div>
            </div>
            <div className="venue-foot">
              <span className="stat"><I name="calendar" /> <span className="num">{total}</span> event{total === 1 ? '' : 's'}</span>
              <span className="stat" style={{ color: 'var(--ink-3)' }}>
                {upcoming > 0 ? <><span className="num" style={{ color: 'var(--ok)' }}>{upcoming}</span> upcoming</> : 'No upcoming'}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

// ── TABLE ──────────────────────────────────────────────────
function VenueTableView({ venues, sort, onSort, onEdit, onDelete }) {
  const cols = [
    { id: 'name',    label: 'Venue' },
    { id: 'city',    label: 'City' },
    { id: 'events',  label: 'Events' },
    { id: 'upcoming',label: 'Upcoming' },
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
          {venues.map(v => {
            const total = window.eventCountForVenue(v.id);
            const upc = window.upcomingCountForVenue(v.id);
            return (
              <tr key={v.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 42, height: 32,
                      borderRadius: 'var(--r-sm)',
                      background: colorFromName(v.name),
                      display: 'grid', placeItems: 'center',
                      flexShrink: 0,
                    }}>
                      <window.I name="pin" size={14} style={{ color: 'white' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4 className="ev-title">{v.name}</h4>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 360 }}>
                        {v.address}
                      </div>
                    </div>
                  </div>
                </td>
                <td><span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{v.city || '—'}</span></td>
                <td><span style={{ fontVariantNumeric: 'tabular-nums' }}>{total}</span></td>
                <td>
                  {upc > 0
                    ? <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ok)', fontWeight: 500 }}>{upc}</span>
                    : <span style={{ color: 'var(--ink-3)' }}>—</span>}
                </td>
                <td><span style={{ fontSize: 12, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{v.updatedAt ? window.fmtDate(v.updatedAt) : '—'}</span></td>
                <td className="actions">
                  <VenueActions venue={v} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── ROWS ───────────────────────────────────────────────────
function VenueRowsView({ venues, onEdit, onDelete }) {
  if (venues.length === 0) {
    return <div className="empty"><h3 className="ttl">No venues match.</h3><p>Adjust filters or add a new venue.</p></div>;
  }
  return (
    <div className="rows">
      {venues.map(v => {
        const total = window.eventCountForVenue(v.id);
        const upc = window.upcomingCountForVenue(v.id);
        const src = extractMapSrc(v.mapEmbedHtml);
        return (
          <article className="venue-row" key={v.id}>
            <div className="mini-map">
              {src ? (
                <iframe
                  src={src}
                  title={`${v.name} map`}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, pointerEvents: 'none' }}
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <MapPlaceholder venue={v} mini />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 className="venue-row-name">{v.name}</h3>
              <p className="venue-row-meta">
                <I name="pin" /> {v.address}{v.city ? ` · ${v.city}` : ''}
              </p>
              <p className="venue-row-desc">
                {v.description || <span style={{ color: 'var(--ink-3)' }}>No description.</span>}
              </p>
            </div>
            <div className="art-row-stats">
              <span className="stat"><I name="calendar" /> <span className="num">{total}</span> events</span>
              {upc > 0 && <span className="stat" style={{ color: 'var(--ok)' }}><I name="sparkle" /> <span className="num">{upc}</span> upcoming</span>}
              <span className="stat" style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{v.uuid}</span>
            </div>
            <div className="art-row-side">
              <VenueActions venue={v} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

Object.assign(window, { VenueGridView, VenueTableView, VenueRowsView, MapPlaceholder, extractMapSrc });
