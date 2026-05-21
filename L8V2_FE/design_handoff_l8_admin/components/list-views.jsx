// Four list layouts: table, rows, grid, timeline.
// Each receives the same props and renders against the shared event list.

const { I, StatusPill, Poster, SoldRatio } = window;

function ActionButtons({ event, onEdit, onDelete, onDuplicate }) {
  return (
    <div className="row-actions">
      <button className="btn btn-ghost btn-icon" title="Duplicate" onClick={() => onDuplicate(event)}>
        <I name="copy" />
      </button>
      <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => onEdit(event)}>
        <I name="edit" />
      </button>
      <button className="btn btn-ghost btn-icon btn-danger" title="Delete" onClick={() => onDelete(event)}>
        <I name="trash" />
      </button>
    </div>
  );
}

// ── TABLE ──────────────────────────────────────────────────
function TableView({ events, sort, onSort, onEdit, onDelete, onDuplicate }) {
  const cols = [
    { id: 'title',  label: 'Event' },
    { id: 'date',   label: 'Date & Time' },
    { id: 'venue',  label: 'Venue' },
    { id: 'status', label: 'Status' },
    { id: 'sold',   label: 'Sold' },
    { id: 'actions',label: '', sortable: false },
  ];
  const SortIcon = ({ id }) => {
    if (sort.col !== id) return <span className="sort"><I name="chevron-down" size={11} /></span>;
    return <span className="sort"><I name={sort.dir === 'asc' ? 'sort-asc' : 'sort-desc'} size={12} /></span>;
  };
  return (
    <div className="tbl-wrap">
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
          {events.map(ev => {
            const venue = window.venueById(ev.venueId);
            const arts = window.artistsById(ev.artistIds);
            return (
              <tr key={ev.id}>
                <td>
                  <h4 className="ev-title">{ev.title}</h4>
                  <div className="ev-meta">
                    {arts.slice(0, 3).map(a => <span key={a.id} className="artist-chip">{a.name}</span>)}
                    {arts.length > 3 && <span className="artist-chip-more">+{arts.length - 3} more</span>}
                  </div>
                </td>
                <td>
                  <div className="date-cell">
                    <div className="d">{window.fmtDate(ev.date)}</div>
                    <div className="t">{ev.time}{ev.endTime ? ` – ${ev.endTime}` : ''}</div>
                  </div>
                </td>
                <td>
                  {venue ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <I name="pin" size={13} style={{ color: 'var(--ink-3)' }} />
                      <span>{venue.name}</span>
                    </div>
                  ) : <span style={{ color: 'var(--ink-3)' }}>—</span>}
                </td>
                <td><StatusPill status={ev.status} /></td>
                <td>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                    {ev.sold.toLocaleString()} / {ev.capacity.toLocaleString()}
                  </div>
                  <div style={{ width: 90, height: 3, background: 'var(--bg-2)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (ev.sold / ev.capacity) * 100)}%`, height: '100%', background: 'var(--accent)' }} />
                  </div>
                </td>
                <td className="actions">
                  <ActionButtons event={ev} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {events.length === 0 && (
        <div className="empty">
          <h3 className="ttl">No events match.</h3>
          <p>Adjust filters or add a new event.</p>
        </div>
      )}
    </div>
  );
}

// ── ROWS ───────────────────────────────────────────────────
function RowsView({ events, onEdit, onDelete, onDuplicate }) {
  if (events.length === 0) {
    return <div className="empty"><h3 className="ttl">No events match.</h3><p>Adjust filters or add a new event.</p></div>;
  }
  return (
    <div className="rows">
      {events.map(ev => {
        const venue = window.venueById(ev.venueId);
        const arts = window.artistsById(ev.artistIds);
        return (
          <article className="row-card" key={ev.id}>
            <Poster event={ev} />
            <div className="row-main">
              <h3 className="row-title">{ev.title}</h3>
              <div className="row-meta">
                <span className="mi"><I name="calendar" /> {window.fmtDate(ev.date)}</span>
                <span className="mi"><I name="clock" /> {ev.time}{ev.endTime ? `–${ev.endTime}` : ''}</span>
                {venue && <span className="mi"><I name="pin" /> {venue.name}</span>}
                <StatusPill status={ev.status} />
              </div>
              <div className="row-artists">
                {arts.slice(0, 5).map(a => <span key={a.id} className="artist-chip">{a.name}</span>)}
                {arts.length > 5 && <span className="artist-chip-more">+{arts.length - 5}</span>}
              </div>
            </div>
            <div className="row-side">
              <SoldRatio event={ev} />
              <ActionButtons event={ev} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

// ── GRID (posters) ─────────────────────────────────────────
function GridView({ events, onEdit, onDelete, onDuplicate }) {
  if (events.length === 0) {
    return <div className="empty"><h3 className="ttl">No events match.</h3><p>Adjust filters or add a new event.</p></div>;
  }
  return (
    <div className="grid">
      {events.map(ev => {
        const venue = window.venueById(ev.venueId);
        return (
          <article className="poster-card" key={ev.id} onClick={() => onEdit(ev)} style={{ cursor: 'default' }}>
            <Poster event={ev} big />
            <div className="poster-meta">
              <div className="venue">
                <I name="pin" size={12} />
                <span>{venue ? venue.name : '—'}</span>
              </div>
              <StatusPill status={ev.status} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

// ── TIMELINE ───────────────────────────────────────────────
function TimelineView({ events, onEdit, onDelete, onDuplicate }) {
  if (events.length === 0) {
    return <div className="empty"><h3 className="ttl">No events match.</h3><p>Adjust filters or add a new event.</p></div>;
  }
  // Group by month
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const groups = {};
  for (const ev of sorted) {
    const key = window.fmtMonthGroup(ev.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(ev);
  }
  const DOW = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  return (
    <div className="timeline">
      {Object.entries(groups).map(([month, list]) => (
        <section key={month}>
          <header className="tl-month-h">
            <h3 className="mo">{month}</h3>
            <span className="ct">{list.length} event{list.length === 1 ? '' : 's'}</span>
          </header>
          {list.map(ev => {
            const venue = window.venueById(ev.venueId);
            const arts = window.artistsById(ev.artistIds);
            const d = window.fmtDateParts(ev.date);
            const dow = DOW[new Date(ev.date + 'T00:00').getDay()];
            return (
              <div className="tl-row" key={ev.id}>
                <div className="tl-date">
                  <div className="day">{d.day}</div>
                  <div className="dow">{dow}</div>
                </div>
                <div className="tl-mid">
                  <h4 className="ttl">{ev.title}</h4>
                  <div className="meta">
                    <span className="mi"><I name="clock" /> {ev.time}{ev.endTime ? `–${ev.endTime}` : ''}</span>
                    {venue && <span className="mi"><I name="pin" /> {venue.name}</span>}
                    <span className="mi"><I name="users" /> {arts.map(a => a.name).slice(0, 3).join(', ')}{arts.length > 3 ? ` +${arts.length-3}` : ''}</span>
                    <span className="mi"><I name="ticket" /> {ev.sold}/{ev.capacity}</span>
                  </div>
                </div>
                <div className="tl-side">
                  <StatusPill status={ev.status} />
                  <ActionButtons event={ev} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} />
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}

Object.assign(window, { TableView, RowsView, GridView, TimelineView });
