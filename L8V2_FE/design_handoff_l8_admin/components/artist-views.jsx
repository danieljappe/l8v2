// Artist views: grid (cards), table, rows.
// All visual color is derived from artist.name when imageUrl is null —
// nothing is stored beyond schema fields.
const { I, monogram, SocialIcons, colorFromName } = window;

function BookableBadge({ on, compact = false }) {
  if (compact) {
    return (
      <span className={`bookable-pill ${on ? '' : 'off'}`} title={on ? 'Available for booking via L8' : 'Not bookable'}>
        {on ? 'Bookable' : 'Off-roster'}
      </span>
    );
  }
  return <span className={`bookable-pill ${on ? '' : 'off'}`}>{on ? 'Bookable' : 'Off-roster'}</span>;
}

function ArtistActions({ artist, onEdit, onDelete }) {
  return (
    <div className="row-actions">
      <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => onEdit(artist)}>
        <I name="edit" />
      </button>
      <button className="btn btn-ghost btn-icon btn-danger" title="Delete" onClick={() => onDelete(artist)}>
        <I name="trash" />
      </button>
    </div>
  );
}

// Renders <img> if imageUrl is set, otherwise a monogram tile with derived color.
function ArtistImage({ artist, shape = 'square', size = null }) {
  const bg = colorFromName(artist.name);
  const cls =
    shape === 'circle' ? 'art-mono' :
    shape === 'row' ? 'art-row-photo' :
    'art-photo';
  if (artist.imageUrl) {
    return (
      <div className={cls} style={{ '--photo-bg': bg, padding: 0, overflow: 'hidden' }}>
        <img src={artist.imageUrl} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  return (
    <div className={cls} style={{ '--photo-bg': bg }}>
      {shape === 'square' ? (
        <>
          <div className="monogram">{monogram(artist.name)}</div>
          <div className="placeholder-tag">[ no photo ]</div>
        </>
      ) : (
        monogram(artist.name)
      )}
    </div>
  );
}

// ── GRID ───────────────────────────────────────────────────
function ArtistGridView({ artists, onEdit, onDelete }) {
  if (artists.length === 0) {
    return <div className="empty"><h3 className="ttl">No artists match.</h3><p>Adjust filters or add a new artist.</p></div>;
  }
  return (
    <div className="art-grid">
      {artists.map(a => {
        const eventCount = window.eventCountForArtist(a.id);
        return (
          <article className="art-card" key={a.id} onClick={() => onEdit(a)}>
            <div className="art-photo" style={{ '--photo-bg': colorFromName(a.name), padding: 0, position: 'relative' }}>
              {a.imageUrl ? (
                <img src={a.imageUrl} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <div className="monogram">{monogram(a.name)}</div>
                  <div className="placeholder-tag">[ no photo ]</div>
                </>
              )}
              <div className={`book-badge ${a.isBookable ? '' : 'off'}`}>
                <span className="dot" />
                {a.isBookable ? 'Bookable' : 'Off-roster'}
              </div>
            </div>
            <div className="art-body">
              <h3 className="art-name">{a.name}</h3>
              {a.genre && (
                <p className="art-genre">
                  <span>{a.genre}</span>
                </p>
              )}
            </div>
            <div className="art-foot">
              <span className="stat"><I name="calendar" /> {eventCount} event{eventCount === 1 ? '' : 's'}</span>
              <SocialIcons socials={a.socialMedia} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

// ── TABLE ──────────────────────────────────────────────────
function ArtistTableView({ artists, sort, onSort, onEdit, onDelete }) {
  const cols = [
    { id: 'name',   label: 'Artist' },
    { id: 'genre',  label: 'Genre' },
    { id: 'events', label: 'Events' },
    { id: 'bookable', label: 'Bookable' },
    { id: 'manager', label: 'Booking manager' },
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
          {artists.map(a => {
            const evc = window.eventCountForArtist(a.id);
            const user = window.userById(a.bookingUserId);
            return (
              <tr key={a.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="art-mono" style={{ '--photo-bg': colorFromName(a.name) }}>
                      {a.imageUrl ? (
                        <img src={a.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : monogram(a.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4 className="ev-title">{a.name}</h4>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                        {a.uuid}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{a.genre || '—'}</span>
                </td>
                <td>
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{evc}</span>
                </td>
                <td><BookableBadge on={a.isBookable} compact /></td>
                <td>
                  {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="sb-avatar" style={{ width: 22, height: 22, fontSize: 10 }}>
                        {monogram(user.name)}
                      </div>
                      <span style={{ fontSize: 13 }}>{user.name}</span>
                    </div>
                  ) : <span style={{ color: 'var(--ink-3)' }}>Unassigned</span>}
                </td>
                <td>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>
                    {a.updatedAt ? window.fmtDate(a.updatedAt) : '—'}
                  </span>
                </td>
                <td className="actions">
                  <ArtistActions artist={a} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {artists.length === 0 && (
        <div className="empty"><h3 className="ttl">No artists match.</h3><p>Adjust filters or add a new artist.</p></div>
      )}
    </div>
  );
}

// ── ROWS ───────────────────────────────────────────────────
function ArtistRowsView({ artists, onEdit, onDelete }) {
  if (artists.length === 0) {
    return <div className="empty"><h3 className="ttl">No artists match.</h3><p>Adjust filters or add a new artist.</p></div>;
  }
  return (
    <div className="rows">
      {artists.map(a => {
        const evc = window.eventCountForArtist(a.id);
        const user = window.userById(a.bookingUserId);
        return (
          <article className="art-row" key={a.id}>
            <div className="art-row-photo" style={{ '--photo-bg': colorFromName(a.name), padding: 0, overflow: 'hidden' }}>
              {a.imageUrl
                ? <img src={a.imageUrl} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : monogram(a.name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 className="art-row-name">{a.name}</h3>
              <div className="art-row-meta">
                {a.genre && <>
                  <span>{a.genre}</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'currentColor', opacity: 0.4 }} />
                </>}
                <SocialIcons socials={a.socialMedia} />
              </div>
              <p className="art-row-bio">{a.bio || <span style={{ color: 'var(--ink-3)' }}>No bio yet.</span>}</p>
            </div>
            <div className="art-row-stats">
              <span className="stat"><I name="calendar" /> <span className="num">{evc}</span> events</span>
              {user && (
                <span className="stat" style={{ color: 'var(--ink-3)' }}>
                  <I name="user" /> Booking: {user.name.split(' ')[0]}
                </span>
              )}
            </div>
            <div className="art-row-side">
              <BookableBadge on={a.isBookable} compact />
              <ArtistActions artist={a} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

Object.assign(window, { ArtistGridView, ArtistTableView, ArtistRowsView, BookableBadge, ArtistImage });
