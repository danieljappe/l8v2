// L8 Events admin — main app
// Owns CRUD state, filters, view layout, editor pattern, tweaks.

const { useState, useMemo, useEffect, useRef } = React;
window.useState = useState;
window.useMemo = useMemo;
window.useEffect = useEffect;
window.useRef = useRef;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "aesthetic": "editorial",
  "layout": "table",
  "pattern": "drawer",
  "artistLayout": "grid",
  "venueLayout": "grid",
  "galleryLayout": "masonry",
  "messageLayout": "inbox",
  "userLayout": "grid"
}/*EDITMODE-END*/;

// ── EVENTS PAGE ────────────────────────────────────────────
function EventsPage({ tweaks, setTweak, registerOpenCreate }) {
  const { I, TableView, RowsView, GridView, TimelineView, Editor } = window;

  const [events, setEvents] = window.useState(window.EVENTS);
  const [editor, setEditor] = window.useState({ open: false, mode: 'create', initial: null });
  const [toast, setToast] = window.useState(null);
  const [confirmDel, setConfirmDel] = window.useState(null);

  function showToast(msg, action) {
    setToast({ msg, action });
    setTimeout(() => setToast(null), 3200);
  }
  function openCreate() { setEditor({ open: true, mode: 'create', initial: null }); }
  function openEdit(ev) { setEditor({ open: true, mode: 'edit', initial: ev }); }
  function closeEditor() { setEditor(e => ({ ...e, open: false })); }

  window.useEffect(() => {
    registerOpenCreate?.(() => openCreate);
  }, [registerOpenCreate]);

  function saveEvent(ev) {
    if (ev.id) {
      setEvents(list => list.map(x => x.id === ev.id ? { ...x, ...ev } : x));
      showToast('Event updated.');
    } else {
      const newId = Math.max(0, ...events.map(e => e.id)) + 1;
      setEvents(list => [{ ...ev, id: newId, sold: 0 }, ...list]);
      showToast('Event created.');
    }
    closeEditor();
  }
  function duplicateEvent(ev) {
    const newId = Math.max(0, ...events.map(e => e.id)) + 1;
    const copy = { ...ev, id: newId, title: `${ev.title} (copy)`, status: 'draft', sold: 0 };
    setEvents(list => [copy, ...list]);
    showToast(`Duplicated "${ev.title}"`);
  }
  function deleteEvent(ev) { setConfirmDel(ev); }
  function confirmDelete() {
    const ev = confirmDel;
    setEvents(list => list.filter(x => x.id !== ev.id));
    setConfirmDel(null);
    if (editor.initial?.id === ev.id) closeEditor();
    showToast(`Deleted "${ev.title}"`, {
      label: 'Undo',
      onClick: () => setEvents(list => [ev, ...list]),
    });
  }

  const [q, setQ] = window.useState('');
  const [statusFilter, setStatusFilter] = window.useState('all');
  const [venueFilter, setVenueFilter] = window.useState('all');
  const [sort, setSort] = window.useState({ col: 'date', dir: 'desc' });

  function onSort(col) {
    setSort(s => s.col === col
      ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { col, dir: 'asc' });
  }

  const filtered = window.useMemo(() => {
    let list = events;
    if (q.trim()) {
      const lower = q.toLowerCase();
      list = list.filter(ev => {
        if (ev.title.toLowerCase().includes(lower)) return true;
        const venue = window.venueById(ev.venueId);
        if (venue?.name.toLowerCase().includes(lower)) return true;
        const arts = window.artistsById(ev.artistIds);
        if (arts.some(a => a.name.toLowerCase().includes(lower))) return true;
        return false;
      });
    }
    if (statusFilter !== 'all') list = list.filter(ev => ev.status === statusFilter);
    if (venueFilter !== 'all')  list = list.filter(ev => ev.venueId === parseInt(venueFilter));
    const dir = sort.dir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      switch (sort.col) {
        case 'title': return a.title.localeCompare(b.title) * dir;
        case 'venue': {
          const va = window.venueById(a.venueId)?.name || '';
          const vb = window.venueById(b.venueId)?.name || '';
          return va.localeCompare(vb) * dir;
        }
        case 'status': return a.status.localeCompare(b.status) * dir;
        case 'sold': return (a.sold - b.sold) * dir;
        case 'date':
        default: return a.date.localeCompare(b.date) * dir;
      }
    });
    return list;
  }, [events, q, statusFilter, venueFilter, sort]);

  const counts = window.useMemo(() => {
    const out = { all: events.length, upcoming: 0, completed: 0, draft: 0, cancelled: 0 };
    events.forEach(e => { out[e.status] = (out[e.status] || 0) + 1; });
    return out;
  }, [events]);

  const layoutProps = {
    events: filtered, sort, onSort,
    onEdit: openEdit, onDelete: deleteEvent, onDuplicate: duplicateEvent,
  };
  let ListView;
  if (tweaks.layout === 'rows') ListView = RowsView;
  else if (tweaks.layout === 'grid') ListView = GridView;
  else if (tweaks.layout === 'timeline') ListView = TimelineView;
  else ListView = TableView;

  window.useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (editor.open) closeEditor();
        if (confirmDel) setConfirmDel(null);
      }
      if ((e.key === 'n' || e.key === 'N') && !editor.open && document.activeElement === document.body) {
        e.preventDefault();
        openCreate();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    <>
      <div className="topbar">
        <div className="topbar-head">
          <div>
            <h2>Events</h2>
            <div className="sub">{counts.all} total · {counts.upcoming} upcoming · {counts.completed} completed{counts.draft ? ` · ${counts.draft} draft` : ''}</div>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-primary" onClick={openCreate}>
              <I name="plus" /> New event
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                opacity: 0.5, border: '1px solid currentColor',
                borderRadius: 3, padding: '1px 4px', marginLeft: 4,
              }}>N</span>
            </button>
          </div>
        </div>

        <div className="toolbar">
          <div className="search">
            <I name="search" />
            <input
              placeholder="Search events, artists, venues…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {['all', 'upcoming', 'completed', 'draft'].map(s => (
              <button
                key={s}
                className={`chip-filter ${statusFilter === s ? 'is-on' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
                <span className="ct">{counts[s] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="divider" />
          <select
            className="select"
            style={{ width: 'auto', height: 36, fontSize: 13 }}
            value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value)}
          >
            <option value="all">All venues</option>
            {window.VENUES.map(v => (<option key={v.id} value={v.id}>{v.name}</option>))}
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>View</span>
            <div className="viewswitch">
              {[
                { id: 'table', icon: 'table' },
                { id: 'rows', icon: 'list' },
                { id: 'grid', icon: 'grid' },
                { id: 'timeline', icon: 'timeline' },
              ].map(v => (
                <button
                  key={v.id}
                  className={tweaks.layout === v.id ? 'is-on' : ''}
                  onClick={() => setTweak('layout', v.id)}
                  title={v.id}
                >
                  <I name={v.icon} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="body">
        <ListView {...layoutProps} />
      </div>

      <Editor
        pattern={tweaks.pattern}
        open={editor.open}
        mode={editor.mode}
        initial={editor.initial}
        onSave={saveEvent}
        onCancel={(why) => {
          if (why === 'delete' && editor.initial) deleteEvent(editor.initial);
          else closeEditor();
        }}
      />

      {confirmDel && (
        <>
          <div className="scrim is-open" onClick={() => setConfirmDel(null)} />
          <div className="modal-shell is-open" style={{ zIndex: 110 }}>
            <div className="modal-card" style={{ maxWidth: 460 }}>
              <div className="fhead">
                <div className="fhead-l">
                  <div>
                    <div className="crumb">Confirm</div>
                    <h3>Delete event?</h3>
                  </div>
                </div>
              </div>
              <div className="fbody">
                <p style={{ margin: 0, color: 'var(--ink-2)' }}>
                  This will remove <strong style={{ color: 'var(--ink)' }}>"{confirmDel.title}"</strong> from your events list.
                  You'll have a moment to undo.
                </p>
              </div>
              <div className="ffoot">
                <span />
                <div className="ffoot-r">
                  <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancel</button>
                  <button className="btn" style={{ background: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' }} onClick={confirmDelete}>
                    <I name="trash" /> Delete event
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className={`toast is-on`}>
          <span>{toast.msg}</span>
          {toast.action && (
            <button
              className="btn btn-sm"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'inherit' }}
              onClick={() => { toast.action.onClick(); setToast(null); }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </>
  );
}

// ── ARTISTS PAGE ──────────────────────────────────────────
function ArtistsPage({ tweaks, setTweak, registerOpenCreate }) {
  const { I, ArtistGridView, ArtistTableView, ArtistRowsView, ArtistEditor } = window;

  const [artists, setArtists] = window.useState(window.ARTISTS);
  const [editor, setEditor] = window.useState({ open: false, mode: 'create', initial: null });
  const [toast, setToast] = window.useState(null);
  const [confirmDel, setConfirmDel] = window.useState(null);

  function showToast(msg, action) {
    setToast({ msg, action });
    setTimeout(() => setToast(null), 3200);
  }
  function openCreate() { setEditor({ open: true, mode: 'create', initial: null }); }
  function openEdit(a) { setEditor({ open: true, mode: 'edit', initial: a }); }
  function closeEditor() { setEditor(e => ({ ...e, open: false })); }

  window.useEffect(() => {
    registerOpenCreate?.(() => openCreate);
  }, [registerOpenCreate]);

  function saveArtist(a) {
    if (a.id) {
      setArtists(list => list.map(x => x.id === a.id ? { ...x, ...a } : x));
      showToast('Artist updated.');
    } else {
      const newId = Math.max(0, ...artists.map(x => x.id)) + 1;
      setArtists(list => [{ ...a, id: newId, uuid: `a-${String(newId).padStart(3, '0')}` }, ...list]);
      showToast('Artist created.');
    }
    closeEditor();
  }
  function deleteArtist(a) { setConfirmDel(a); }
  function confirmDelete() {
    const a = confirmDel;
    setArtists(list => list.filter(x => x.id !== a.id));
    setConfirmDel(null);
    if (editor.initial?.id === a.id) closeEditor();
    showToast(`Removed "${a.name}"`, {
      label: 'Undo',
      onClick: () => setArtists(list => [a, ...list]),
    });
  }

  const [q, setQ] = window.useState('');
  const [bookFilter, setBookFilter] = window.useState('all');
  const [genreFilter, setGenreFilter] = window.useState('all');
  const [sort, setSort] = window.useState({ col: 'name', dir: 'asc' });

  function onSort(col) {
    setSort(s => s.col === col
      ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { col, dir: 'asc' });
  }

  const genres = window.useMemo(() => {
    const s = new Set();
    artists.forEach(a => a.genre && s.add(a.genre));
    return [...s].sort();
  }, [artists]);

  const filtered = window.useMemo(() => {
    let list = artists;
    if (q.trim()) {
      const lower = q.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(lower) ||
        (a.genre || '').toLowerCase().includes(lower) ||
        (a.bio || '').toLowerCase().includes(lower)
      );
    }
    if (bookFilter === 'bookable')   list = list.filter(a => a.isBookable);
    if (bookFilter === 'off-roster') list = list.filter(a => !a.isBookable);
    if (genreFilter !== 'all')       list = list.filter(a => a.genre === genreFilter);

    const dir = sort.dir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      switch (sort.col) {
        case 'genre': return (a.genre || '').localeCompare(b.genre || '') * dir;
        case 'events': return (window.eventCountForArtist(a.id) - window.eventCountForArtist(b.id)) * dir;
        case 'bookable': return (Number(a.isBookable) - Number(b.isBookable)) * dir;
        case 'manager': {
          const ua = window.userById(a.bookingUserId)?.name || '';
          const ub = window.userById(b.bookingUserId)?.name || '';
          return ua.localeCompare(ub) * dir;
        }
        case 'updated': return (a.updatedAt || '').localeCompare(b.updatedAt || '') * dir;
        case 'name':
        default: return a.name.localeCompare(b.name) * dir;
      }
    });
    return list;
  }, [artists, q, bookFilter, genreFilter, sort]);

  const counts = window.useMemo(() => ({
    all: artists.length,
    bookable: artists.filter(a => a.isBookable).length,
    'off-roster': artists.filter(a => !a.isBookable).length,
  }), [artists]);

  let ListView;
  if (tweaks.artistLayout === 'rows') ListView = ArtistRowsView;
  else if (tweaks.artistLayout === 'table') ListView = ArtistTableView;
  else ListView = ArtistGridView;

  window.useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (editor.open) closeEditor();
        if (confirmDel) setConfirmDel(null);
      }
      if ((e.key === 'n' || e.key === 'N') && !editor.open && document.activeElement === document.body) {
        e.preventDefault();
        openCreate();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    <>
      <div className="topbar">
        <div className="topbar-head">
          <div>
            <h2>Artists</h2>
            <div className="sub">{counts.all} on roster · {counts.bookable} bookable · {counts['off-roster']} off-roster</div>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-primary" onClick={openCreate}>
              <I name="plus" /> New artist
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                opacity: 0.5, border: '1px solid currentColor',
                borderRadius: 3, padding: '1px 4px', marginLeft: 4,
              }}>N</span>
            </button>
          </div>
        </div>

        <div className="toolbar">
          <div className="search">
            <I name="search" />
            <input
              placeholder="Search artists, genre, bio…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {['all', 'bookable', 'off-roster'].map(s => (
              <button
                key={s}
                className={`chip-filter ${bookFilter === s ? 'is-on' : ''}`}
                onClick={() => setBookFilter(s)}
              >
                {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
                <span className="ct">{counts[s] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="divider" />
          <select
            className="select"
            style={{ width: 'auto', height: 36, fontSize: 13 }}
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
          >
            <option value="all">All genres</option>
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>View</span>
            <div className="viewswitch">
              {[
                { id: 'grid', icon: 'grid' },
                { id: 'rows', icon: 'list' },
                { id: 'table', icon: 'table' },
              ].map(v => (
                <button
                  key={v.id}
                  className={tweaks.artistLayout === v.id ? 'is-on' : ''}
                  onClick={() => setTweak('artistLayout', v.id)}
                  title={v.id}
                >
                  <I name={v.icon} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="body">
        <ListView
          artists={filtered}
          sort={sort}
          onSort={onSort}
          onEdit={openEdit}
          onDelete={deleteArtist}
        />
      </div>

      <ArtistEditor
        pattern={tweaks.pattern}
        open={editor.open}
        mode={editor.mode}
        initial={editor.initial}
        onSave={saveArtist}
        onCancel={(why) => {
          if (why === 'delete' && editor.initial) deleteArtist(editor.initial);
          else closeEditor();
        }}
      />

      {confirmDel && (
        <>
          <div className="scrim is-open" onClick={() => setConfirmDel(null)} />
          <div className="modal-shell is-open" style={{ zIndex: 110 }}>
            <div className="modal-card" style={{ maxWidth: 460 }}>
              <div className="fhead">
                <div className="fhead-l">
                  <div>
                    <div className="crumb">Confirm</div>
                    <h3>Remove artist?</h3>
                  </div>
                </div>
              </div>
              <div className="fbody">
                <p style={{ margin: 0, color: 'var(--ink-2)' }}>
                  Remove <strong style={{ color: 'var(--ink)' }}>"{confirmDel.name}"</strong> from your roster.
                  Past events featuring this artist are kept.
                </p>
              </div>
              <div className="ffoot">
                <span />
                <div className="ffoot-r">
                  <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancel</button>
                  <button className="btn" style={{ background: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' }} onClick={confirmDelete}>
                    <I name="trash" /> Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className={`toast is-on`}>
          <span>{toast.msg}</span>
          {toast.action && (
            <button
              className="btn btn-sm"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'inherit' }}
              onClick={() => { toast.action.onClick(); setToast(null); }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </>
  );
}

// ── VENUES PAGE ───────────────────────────────────────────
function VenuesPage({ tweaks, setTweak }) {
  const { I, VenueGridView, VenueTableView, VenueRowsView, VenueEditor } = window;

  const [venues, setVenues] = window.useState(window.VENUES);
  const [editor, setEditor] = window.useState({ open: false, mode: 'create', initial: null });
  const [toast, setToast] = window.useState(null);
  const [confirmDel, setConfirmDel] = window.useState(null);

  function showToast(msg, action) {
    setToast({ msg, action });
    setTimeout(() => setToast(null), 3200);
  }
  function openCreate() { setEditor({ open: true, mode: 'create', initial: null }); }
  function openEdit(v) { setEditor({ open: true, mode: 'edit', initial: v }); }
  function closeEditor() { setEditor(e => ({ ...e, open: false })); }

  function saveVenue(v) {
    if (v.id) {
      setVenues(list => list.map(x => x.id === v.id ? { ...x, ...v } : x));
      showToast('Venue updated.');
    } else {
      const newId = Math.max(0, ...venues.map(x => x.id)) + 1;
      setVenues(list => [{ ...v, id: newId, uuid: `v-${String(newId).padStart(3, '0')}` }, ...list]);
      showToast('Venue created.');
    }
    closeEditor();
  }
  function deleteVenue(v) { setConfirmDel(v); }
  function confirmDelete() {
    const v = confirmDel;
    setVenues(list => list.filter(x => x.id !== v.id));
    setConfirmDel(null);
    if (editor.initial?.id === v.id) closeEditor();
    showToast(`Removed "${v.name}"`, {
      label: 'Undo',
      onClick: () => setVenues(list => [v, ...list]),
    });
  }

  const [q, setQ] = window.useState('');
  const [cityFilter, setCityFilter] = window.useState('all');
  const [sort, setSort] = window.useState({ col: 'name', dir: 'asc' });

  function onSort(col) {
    setSort(s => s.col === col
      ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { col, dir: 'asc' });
  }

  const cities = window.useMemo(() => {
    const s = new Set();
    venues.forEach(v => v.city && s.add(v.city));
    return [...s].sort();
  }, [venues]);

  const filtered = window.useMemo(() => {
    let list = venues;
    if (q.trim()) {
      const lower = q.toLowerCase();
      list = list.filter(v =>
        v.name.toLowerCase().includes(lower) ||
        (v.city || '').toLowerCase().includes(lower) ||
        (v.address || '').toLowerCase().includes(lower) ||
        (v.description || '').toLowerCase().includes(lower)
      );
    }
    if (cityFilter !== 'all') list = list.filter(v => v.city === cityFilter);

    const dir = sort.dir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      switch (sort.col) {
        case 'city':     return (a.city || '').localeCompare(b.city || '') * dir;
        case 'events':   return (window.eventCountForVenue(a.id) - window.eventCountForVenue(b.id)) * dir;
        case 'upcoming': return (window.upcomingCountForVenue(a.id) - window.upcomingCountForVenue(b.id)) * dir;
        case 'updated':  return (a.updatedAt || '').localeCompare(b.updatedAt || '') * dir;
        case 'name':
        default: return a.name.localeCompare(b.name) * dir;
      }
    });
    return list;
  }, [venues, q, cityFilter, sort]);

  const counts = window.useMemo(() => {
    const total = venues.length;
    return { all: total };
  }, [venues]);

  let ListView;
  if (tweaks.venueLayout === 'rows') ListView = VenueRowsView;
  else if (tweaks.venueLayout === 'table') ListView = VenueTableView;
  else ListView = VenueGridView;

  window.useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (editor.open) closeEditor();
        if (confirmDel) setConfirmDel(null);
      }
      if ((e.key === 'n' || e.key === 'N') && !editor.open && document.activeElement === document.body) {
        e.preventDefault();
        openCreate();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    <>
      <div className="topbar">
        <div className="topbar-head">
          <div>
            <h2>Venues</h2>
            <div className="sub">{counts.all} venue{counts.all === 1 ? '' : 's'}</div>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-primary" onClick={openCreate}>
              <I name="plus" /> New venue
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                opacity: 0.5, border: '1px solid currentColor',
                borderRadius: 3, padding: '1px 4px', marginLeft: 4,
              }}>N</span>
            </button>
          </div>
        </div>

        <div className="toolbar">
          <div className="search">
            <I name="search" />
            <input
              placeholder="Search venues, city, address…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              className={`chip-filter ${cityFilter === 'all' ? 'is-on' : ''}`}
              onClick={() => setCityFilter('all')}
            >All <span className="ct">{counts.all}</span></button>
            {cities.map(c => (
              <button
                key={c}
                className={`chip-filter ${cityFilter === c ? 'is-on' : ''}`}
                onClick={() => setCityFilter(c)}
              >
                {c}
                <span className="ct">{venues.filter(v => v.city === c).length}</span>
              </button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>View</span>
            <div className="viewswitch">
              {[
                { id: 'grid', icon: 'grid' },
                { id: 'rows', icon: 'list' },
                { id: 'table', icon: 'table' },
              ].map(v => (
                <button
                  key={v.id}
                  className={tweaks.venueLayout === v.id ? 'is-on' : ''}
                  onClick={() => setTweak('venueLayout', v.id)}
                  title={v.id}
                >
                  <I name={v.icon} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="body">
        <ListView
          venues={filtered}
          sort={sort}
          onSort={onSort}
          onEdit={openEdit}
          onDelete={deleteVenue}
        />
      </div>

      <VenueEditor
        pattern={tweaks.pattern}
        open={editor.open}
        mode={editor.mode}
        initial={editor.initial}
        onSave={saveVenue}
        onCancel={(why) => {
          if (why === 'delete' && editor.initial) deleteVenue(editor.initial);
          else closeEditor();
        }}
      />

      {confirmDel && (
        <>
          <div className="scrim is-open" onClick={() => setConfirmDel(null)} />
          <div className="modal-shell is-open" style={{ zIndex: 110 }}>
            <div className="modal-card" style={{ maxWidth: 460 }}>
              <div className="fhead">
                <div className="fhead-l">
                  <div>
                    <div className="crumb">Confirm</div>
                    <h3>Remove venue?</h3>
                  </div>
                </div>
              </div>
              <div className="fbody">
                <p style={{ margin: 0, color: 'var(--ink-2)' }}>
                  Remove <strong style={{ color: 'var(--ink)' }}>"{confirmDel.name}"</strong>.
                  Past events at this venue are kept; upcoming events will need a new venue.
                </p>
              </div>
              <div className="ffoot">
                <span />
                <div className="ffoot-r">
                  <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancel</button>
                  <button className="btn" style={{ background: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' }} onClick={confirmDelete}>
                    <I name="trash" /> Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className={`toast is-on`}>
          <span>{toast.msg}</span>
          {toast.action && (
            <button
              className="btn btn-sm"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'inherit' }}
              onClick={() => { toast.action.onClick(); setToast(null); }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </>
  );
}

// ── GALLERY PAGE ──────────────────────────────────────────
function GalleryPage({ tweaks, setTweak }) {
  const { I, GalleryMasonryView, GalleryRowsView, GalleryTableView, GalleryLightbox, GalleryEditor } = window;

  const [items, setItems] = window.useState(window.GALLERY);
  const [editor, setEditor] = window.useState({ open: false, mode: 'create', initial: null });
  const [lightbox, setLightbox] = window.useState({ open: false, item: null });
  const [toast, setToast] = window.useState(null);
  const [confirmDel, setConfirmDel] = window.useState(null);

  function showToast(msg, action) {
    setToast({ msg, action });
    setTimeout(() => setToast(null), 3200);
  }
  function openCreate() { setEditor({ open: true, mode: 'create', initial: null }); setLightbox({ open: false, item: null }); }
  function openEdit(g) { setEditor({ open: true, mode: 'edit', initial: g }); setLightbox({ open: false, item: null }); }
  function closeEditor() { setEditor(e => ({ ...e, open: false })); }
  function openLightbox(g) { setLightbox({ open: true, item: g }); }
  function closeLightbox() { setLightbox(lb => ({ ...lb, open: false })); }

  function saveItem(g) {
    if (g.id) {
      setItems(list => list.map(x => x.id === g.id ? { ...x, ...g } : x));
      showToast('Photo updated.');
    } else {
      const newId = Math.max(0, ...items.map(x => x.id)) + 1;
      setItems(list => [{ ...g, id: newId, uuid: `g-${String(newId).padStart(3, '0')}` }, ...list]);
      showToast('Photo uploaded.');
    }
    closeEditor();
  }
  function togglePublish(g) {
    setItems(list => list.map(x =>
      x.id === g.id
        ? { ...x, isPublished: !x.isPublished, updatedAt: new Date().toISOString().slice(0, 10) }
        : x
    ));
    showToast(g.isPublished ? `"${g.filename}" unpublished.` : `"${g.filename}" published.`);
    if (lightbox.item?.id === g.id) {
      setLightbox(lb => ({ ...lb, item: { ...lb.item, isPublished: !lb.item.isPublished } }));
    }
  }
  function deleteItem(g) { setConfirmDel(g); }
  function confirmDelete() {
    const g = confirmDel;
    setItems(list => list.filter(x => x.id !== g.id));
    setConfirmDel(null);
    if (editor.initial?.id === g.id) closeEditor();
    if (lightbox.item?.id === g.id) closeLightbox();
    showToast(`Deleted "${g.filename}"`, {
      label: 'Undo',
      onClick: () => setItems(list => [g, ...list]),
    });
  }

  const [q, setQ] = window.useState('');
  const [pubFilter, setPubFilter] = window.useState('all');
  const [catFilter, setCatFilter] = window.useState('all');
  const [photogFilter, setPhotogFilter] = window.useState('all');
  const [eventFilter, setEventFilter] = window.useState('all');
  const [sort, setSort] = window.useState({ col: 'updated', dir: 'desc' });

  function onSort(col) {
    setSort(s => s.col === col
      ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { col, dir: 'asc' });
  }

  const filtered = window.useMemo(() => {
    let list = items;
    if (q.trim()) {
      const lower = q.toLowerCase();
      list = list.filter(g =>
        g.filename.toLowerCase().includes(lower) ||
        (g.caption || '').toLowerCase().includes(lower) ||
        (g.photographer || '').toLowerCase().includes(lower)
      );
    }
    if (pubFilter === 'published') list = list.filter(g => g.isPublished);
    if (pubFilter === 'draft')     list = list.filter(g => !g.isPublished);
    if (catFilter !== 'all')       list = list.filter(g => g.category === catFilter);
    if (photogFilter !== 'all')    list = list.filter(g => g.photographer === photogFilter);
    if (eventFilter !== 'all') {
      if (eventFilter === 'none')  list = list.filter(g => !g.eventId);
      else                          list = list.filter(g => g.eventId === parseInt(eventFilter));
    }

    const dir = sort.dir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      switch (sort.col) {
        case 'filename':     return a.filename.localeCompare(b.filename) * dir;
        case 'category':     return a.category.localeCompare(b.category) * dir;
        case 'photographer': return (a.photographer || '').localeCompare(b.photographer || '') * dir;
        case 'event': {
          const ea = window.eventById(a.eventId)?.title || '';
          const eb = window.eventById(b.eventId)?.title || '';
          return ea.localeCompare(eb) * dir;
        }
        case 'published':    return (Number(a.isPublished) - Number(b.isPublished)) * dir;
        case 'updated':
        default: return (a.updatedAt || '').localeCompare(b.updatedAt || '') * dir;
      }
    });
    return list;
  }, [items, q, pubFilter, catFilter, photogFilter, eventFilter, sort]);

  const counts = window.useMemo(() => {
    const out = { all: items.length, published: 0, draft: 0 };
    items.forEach(g => { out[g.isPublished ? 'published' : 'draft']++; });
    return out;
  }, [items]);
  const catCounts = window.useMemo(() => {
    const out = { all: items.length };
    window.GALLERY_CATEGORIES.forEach(c => {
      out[c] = items.filter(g => g.category === c).length;
    });
    return out;
  }, [items]);

  let ListView;
  if (tweaks.galleryLayout === 'rows') ListView = GalleryRowsView;
  else if (tweaks.galleryLayout === 'table') ListView = GalleryTableView;
  else ListView = GalleryMasonryView;

  window.useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (lightbox.open) closeLightbox();
        else if (editor.open) closeEditor();
        else if (confirmDel) setConfirmDel(null);
      }
      if ((e.key === 'n' || e.key === 'N') && !editor.open && !lightbox.open && document.activeElement === document.body) {
        e.preventDefault();
        openCreate();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const photographers = window.photographerList();

  return (
    <>
      <div className="topbar">
        <div className="topbar-head">
          <div>
            <h2>Gallery</h2>
            <div className="sub">{counts.all} photo{counts.all === 1 ? '' : 's'} · {counts.published} published · {counts.draft} draft</div>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-primary" onClick={openCreate}>
              <I name="plus" /> Upload photo
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                opacity: 0.5, border: '1px solid currentColor',
                borderRadius: 3, padding: '1px 4px', marginLeft: 4,
              }}>N</span>
            </button>
          </div>
        </div>

        <div className="toolbar">
          <div className="search">
            <I name="search" />
            <input
              placeholder="Search filename, caption, photographer…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {['all', 'published', 'draft'].map(s => (
              <button
                key={s}
                className={`chip-filter ${pubFilter === s ? 'is-on' : ''}`}
                onClick={() => setPubFilter(s)}
              >
                {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
                <span className="ct">{counts[s] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="divider" />
          <select
            className="select"
            style={{ width: 'auto', height: 36, fontSize: 13 }}
            value={photogFilter}
            onChange={(e) => setPhotogFilter(e.target.value)}
          >
            <option value="all">All photographers</option>
            {photographers.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            className="select"
            style={{ width: 'auto', height: 36, fontSize: 13 }}
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
          >
            <option value="all">All events</option>
            <option value="none">Not linked</option>
            {window.EVENTS.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>

          <div className="cat-strip">
            <button
              className={catFilter === 'all' ? 'is-on' : ''}
              onClick={() => setCatFilter('all')}
            >
              All <span className="ct">{catCounts.all}</span>
            </button>
            {window.GALLERY_CATEGORIES.map(c => (
              <button
                key={c}
                className={catFilter === c ? 'is-on' : ''}
                onClick={() => setCatFilter(c)}
              >
                {c} <span className="ct">{catCounts[c] || 0}</span>
              </button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>View</span>
            <div className="viewswitch">
              {[
                { id: 'masonry', icon: 'grid' },
                { id: 'rows', icon: 'list' },
                { id: 'table', icon: 'table' },
              ].map(v => (
                <button
                  key={v.id}
                  className={tweaks.galleryLayout === v.id ? 'is-on' : ''}
                  onClick={() => setTweak('galleryLayout', v.id)}
                  title={v.id}
                >
                  <I name={v.icon} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="body">
        <ListView
          items={filtered}
          sort={sort}
          onSort={onSort}
          onEdit={openEdit}
          onDelete={deleteItem}
          onTogglePub={togglePublish}
          onOpen={openLightbox}
        />
      </div>

      <GalleryEditor
        pattern={tweaks.pattern}
        open={editor.open}
        mode={editor.mode}
        initial={editor.initial}
        onSave={saveItem}
        onCancel={(why) => {
          if (why === 'delete' && editor.initial) deleteItem(editor.initial);
          else closeEditor();
        }}
      />

      <GalleryLightbox
        open={lightbox.open}
        item={lightbox.item}
        onClose={closeLightbox}
        onEdit={openEdit}
        onDelete={deleteItem}
        onTogglePub={togglePublish}
      />

      {confirmDel && (
        <>
          <div className="scrim is-open" onClick={() => setConfirmDel(null)} />
          <div className="modal-shell is-open" style={{ zIndex: 110 }}>
            <div className="modal-card" style={{ maxWidth: 460 }}>
              <div className="fhead">
                <div className="fhead-l">
                  <div>
                    <div className="crumb">Confirm</div>
                    <h3>Delete photo?</h3>
                  </div>
                </div>
              </div>
              <div className="fbody">
                <p style={{ margin: 0, color: 'var(--ink-2)' }}>
                  Delete <strong style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{confirmDel.filename}</strong>.
                  This removes the gallery record; the file in storage isn't touched.
                </p>
              </div>
              <div className="ffoot">
                <span />
                <div className="ffoot-r">
                  <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancel</button>
                  <button className="btn" style={{ background: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' }} onClick={confirmDelete}>
                    <I name="trash" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className={`toast is-on`}>
          <span>{toast.msg}</span>
          {toast.action && (
            <button
              className="btn btn-sm"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'inherit' }}
              onClick={() => { toast.action.onClick(); setToast(null); }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </>
  );
}

// ── MESSAGES PAGE ─────────────────────────────────────────
function MessagesPage({ tweaks, setTweak, onUnreadChange }) {
  const { I, MessagesInboxView, MessagesCardsView, MessagesTableView } = window;

  const [messages, setMessages] = window.useState(window.MESSAGES);
  const [selectedId, setSelectedId] = window.useState(
    window.MESSAGES.find(m => !m.isRead)?.id ?? window.MESSAGES[0]?.id ?? null
  );
  const [toast, setToast] = window.useState(null);
  const [confirmDel, setConfirmDel] = window.useState(null);

  function showToast(msg, action) {
    setToast({ msg, action });
    setTimeout(() => setToast(null), 3200);
  }

  // Patch a message — also mark as read on first open
  function patchMessage(m, patch) {
    setMessages(list => list.map(x =>
      x.id === m.id
        ? { ...x, ...patch, updatedAt: new Date().toISOString() }
        : x
    ));
  }
  function selectMessage(id) {
    setSelectedId(id);
    const m = messages.find(x => x.id === id);
    if (m && !m.isRead) {
      patchMessage(m, { isRead: true });
    }
  }
  function markAllRead() {
    setMessages(list => list.map(x => x.isRead ? x : { ...x, isRead: true, updatedAt: new Date().toISOString() }));
    showToast('All messages marked as read.');
  }
  function deleteMessage(m) { setConfirmDel(m); }
  function confirmDelete() {
    const m = confirmDel;
    setMessages(list => list.filter(x => x.id !== m.id));
    setConfirmDel(null);
    if (selectedId === m.id) setSelectedId(null);
    showToast(`Deleted message from ${m.name}`, {
      label: 'Undo',
      onClick: () => setMessages(list => [m, ...list]),
    });
  }

  // Notify parent of unread count for the sidebar badge
  window.useEffect(() => {
    const unread = messages.filter(m =>
      !m.isRead && m.status !== 'spam' && m.status !== 'archived'
    ).length;
    onUnreadChange?.(unread);
  }, [messages, onUnreadChange]);

  const [q, setQ] = window.useState('');
  const [statusFilter, setStatusFilter] = window.useState('all');
  const [typeFilter, setTypeFilter] = window.useState('all');
  const [readFilter, setReadFilter] = window.useState('all');
  const [sort, setSort] = window.useState({ col: 'created', dir: 'desc' });

  function onSort(col) {
    setSort(s => s.col === col
      ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { col, dir: 'asc' });
  }

  const filtered = window.useMemo(() => {
    let list = messages;
    if (q.trim()) {
      const lower = q.toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(lower) ||
        m.email.toLowerCase().includes(lower) ||
        (m.subject || '').toLowerCase().includes(lower) ||
        m.message.toLowerCase().includes(lower)
      );
    }
    if (statusFilter !== 'all') list = list.filter(m => m.status === statusFilter);
    if (typeFilter !== 'all')   list = list.filter(m => m.artistType === typeFilter);
    if (readFilter === 'unread') list = list.filter(m => !m.isRead);
    if (readFilter === 'read')   list = list.filter(m => m.isRead);

    const dir = sort.dir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      switch (sort.col) {
        case 'from':    return a.name.localeCompare(b.name) * dir;
        case 'subject': return (a.subject || '').localeCompare(b.subject || '') * dir;
        case 'type':    return (a.artistType || '').localeCompare(b.artistType || '') * dir;
        case 'status':  return a.status.localeCompare(b.status) * dir;
        case 'created':
        default: return a.createdAt.localeCompare(b.createdAt) * dir;
      }
    });
    return list;
  }, [messages, q, statusFilter, typeFilter, readFilter, sort]);

  const counts = window.useMemo(() => {
    const out = { all: messages.length, unread: 0 };
    window.MESSAGE_STATUSES.forEach(s => { out[s] = 0; });
    messages.forEach(m => {
      if (!m.isRead) out.unread++;
      out[m.status] = (out[m.status] || 0) + 1;
    });
    return out;
  }, [messages]);

  let ListView;
  if (tweaks.messageLayout === 'cards') ListView = MessagesCardsView;
  else if (tweaks.messageLayout === 'table') ListView = MessagesTableView;
  else ListView = MessagesInboxView;

  window.useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && confirmDel) setConfirmDel(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    <>
      <div className="topbar">
        <div className="topbar-head">
          <div>
            <h2>Messages</h2>
            <div className="sub">
              {counts.unread > 0
                ? <><strong style={{ color: 'var(--accent)' }}>{counts.unread} unread</strong> · {counts.all} total · {counts.new} new · {counts.open} open</>
                : <>{counts.all} total · {counts.replied} replied · {counts.archived} archived</>}
            </div>
          </div>
          <div className="topbar-actions">
            <button className="btn" onClick={markAllRead} disabled={counts.unread === 0} style={counts.unread === 0 ? { opacity: 0.5 } : {}}>
              <I name="check" /> Mark all read
            </button>
          </div>
        </div>

        <div className="toolbar">
          <div className="search">
            <I name="search" />
            <input
              placeholder="Search name, email, subject, body…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {['all', 'unread', 'read'].map(s => (
              <button
                key={s}
                className={`chip-filter ${readFilter === s ? 'is-on' : ''}`}
                onClick={() => setReadFilter(s)}
              >
                {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
                {s === 'unread' && <span className="ct">{counts.unread}</span>}
                {s === 'read' && <span className="ct">{counts.all - counts.unread}</span>}
                {s === 'all' && <span className="ct">{counts.all}</span>}
              </button>
            ))}
          </div>
          <div className="divider" />
          <select
            className="select"
            style={{ width: 'auto', height: 36, fontSize: 13 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            {window.MESSAGE_STATUSES.map(s => (
              <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)} ({counts[s] || 0})</option>
            ))}
          </select>
          <select
            className="select"
            style={{ width: 'auto', height: 36, fontSize: 13 }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All inquiries</option>
            {window.ARTIST_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>View</span>
            <div className="viewswitch">
              {[
                { id: 'inbox', icon: 'message' },
                { id: 'cards', icon: 'list' },
                { id: 'table', icon: 'table' },
              ].map(v => (
                <button
                  key={v.id}
                  className={tweaks.messageLayout === v.id ? 'is-on' : ''}
                  onClick={() => setTweak('messageLayout', v.id)}
                  title={v.id}
                >
                  <I name={v.icon} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="body">
        <ListView
          messages={filtered}
          sort={sort}
          onSort={onSort}
          selectedId={selectedId}
          onSelect={selectMessage}
          onPatch={patchMessage}
          onDelete={deleteMessage}
        />
      </div>

      {confirmDel && (
        <>
          <div className="scrim is-open" onClick={() => setConfirmDel(null)} />
          <div className="modal-shell is-open" style={{ zIndex: 110 }}>
            <div className="modal-card" style={{ maxWidth: 460 }}>
              <div className="fhead">
                <div className="fhead-l">
                  <div>
                    <div className="crumb">Confirm</div>
                    <h3>Delete message?</h3>
                  </div>
                </div>
              </div>
              <div className="fbody">
                <p style={{ margin: 0, color: 'var(--ink-2)' }}>
                  Delete the message from <strong style={{ color: 'var(--ink)' }}>{confirmDel.name}</strong>.
                  Consider archiving instead to keep a record.
                </p>
              </div>
              <div className="ffoot">
                <span />
                <div className="ffoot-r">
                  <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancel</button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      patchMessage(confirmDel, { status: 'archived', isRead: true });
                      setConfirmDel(null);
                      showToast('Archived.');
                    }}
                  >Archive instead</button>
                  <button className="btn" style={{ background: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' }} onClick={confirmDelete}>
                    <I name="trash" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className={`toast is-on`}>
          <span>{toast.msg}</span>
          {toast.action && (
            <button
              className="btn btn-sm"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'inherit' }}
              onClick={() => { toast.action.onClick(); setToast(null); }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </>
  );
}

// ── USERS PAGE ────────────────────────────────────────────
function UsersPage({ tweaks, setTweak, currentUser, onNavigateAccount }) {
  const { I, UsersGridView, UsersTableView, UserEditor } = window;

  const [users, setUsers] = window.useState(window.USERS);
  const [editor, setEditor] = window.useState({ open: false, mode: 'create', initial: null });
  const [toast, setToast] = window.useState(null);
  const [confirmDel, setConfirmDel] = window.useState(null);

  function showToast(msg, action) {
    setToast({ msg, action });
    setTimeout(() => setToast(null), 3600);
  }
  function openCreate() { setEditor({ open: true, mode: 'create', initial: null }); }
  function openEdit(u) {
    // Editing yourself? Bounce to Account where you have password etc.
    if (u.id === currentUser?.id) {
      onNavigateAccount?.();
      return;
    }
    setEditor({ open: true, mode: 'edit', initial: u });
  }
  function closeEditor() { setEditor(e => ({ ...e, open: false })); }

  function saveUser(u) {
    if (u.id) {
      setUsers(list => list.map(x => x.id === u.id ? { ...x, ...u } : x));
      showToast('User updated.');
    } else {
      const newId = Math.max(0, ...users.map(x => x.id)) + 1;
      const newUuid = `u-${String(newId).padStart(3, '0')}`;
      setUsers(list => [...list, { ...u, id: newId, uuid: newUuid }]);
      showToast(u.sendInvite
        ? `Invite sent to ${u.email}.`
        : `${u.firstName} ${u.lastName} added.`);
    }
    closeEditor();
  }
  function deleteUser(u) {
    if (u.id === currentUser?.id) {
      showToast("You can't remove yourself.");
      return;
    }
    setConfirmDel(u);
  }
  function confirmDelete() {
    const u = confirmDel;
    setUsers(list => list.filter(x => x.id !== u.id));
    setConfirmDel(null);
    if (editor.initial?.id === u.id) closeEditor();
    showToast(`Removed ${u.firstName} ${u.lastName}.`, {
      label: 'Undo',
      onClick: () => setUsers(list => [...list, u].sort((a, b) => a.id - b.id)),
    });
  }
  function sendResetPwd(u) {
    showToast(`Password reset link sent to ${u.email}.`);
  }

  const [q, setQ] = window.useState('');
  const [roleFilter, setRoleFilter] = window.useState('all');
  const [sort, setSort] = window.useState({ col: 'name', dir: 'asc' });

  function onSort(col) {
    setSort(s => s.col === col
      ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { col, dir: 'asc' });
  }

  const filtered = window.useMemo(() => {
    let list = users;
    if (q.trim()) {
      const lower = q.toLowerCase();
      list = list.filter(u =>
        u.firstName.toLowerCase().includes(lower) ||
        u.lastName.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower) ||
        (u.phoneNumber || '').toLowerCase().includes(lower) ||
        u.role.includes(lower)
      );
    }
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);

    const dir = sort.dir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      switch (sort.col) {
        case 'role':    return a.role.localeCompare(b.role) * dir;
        case 'email':   return a.email.localeCompare(b.email) * dir;
        case 'phone':   return (a.phoneNumber || '').localeCompare(b.phoneNumber || '') * dir;
        case 'created': return a.createdAt.localeCompare(b.createdAt) * dir;
        case 'name':
        default: return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`) * dir;
      }
    });
    return list;
  }, [users, q, roleFilter, sort]);

  const counts = window.useMemo(() => {
    const out = { all: users.length };
    window.USER_ROLES.forEach(r => { out[r] = users.filter(u => u.role === r).length; });
    return out;
  }, [users]);

  let ListView;
  if (tweaks.userLayout === 'table') ListView = UsersTableView;
  else ListView = UsersGridView;

  window.useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (editor.open) closeEditor();
        if (confirmDel) setConfirmDel(null);
      }
      if ((e.key === 'n' || e.key === 'N') && !editor.open && document.activeElement === document.body) {
        e.preventDefault();
        openCreate();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    <>
      <div className="topbar">
        <div className="topbar-head">
          <div>
            <h2>Users</h2>
            <div className="sub">
              {counts.all} team member{counts.all === 1 ? '' : 's'} ·{' '}
              {counts.admin || 0} admin · {counts.manager || 0} manager · {counts.editor || 0} editor · {counts.viewer || 0} viewer
            </div>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-primary" onClick={openCreate}>
              <I name="plus" /> Invite user
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                opacity: 0.5, border: '1px solid currentColor',
                borderRadius: 3, padding: '1px 4px', marginLeft: 4,
              }}>N</span>
            </button>
          </div>
        </div>

        <div className="toolbar">
          <div className="search">
            <I name="search" />
            <input
              placeholder="Search name, email, phone…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              className={`chip-filter ${roleFilter === 'all' ? 'is-on' : ''}`}
              onClick={() => setRoleFilter('all')}
            >
              All <span className="ct">{counts.all}</span>
            </button>
            {window.USER_ROLES.map(r => (
              <button
                key={r}
                className={`chip-filter ${roleFilter === r ? 'is-on' : ''}`}
                onClick={() => setRoleFilter(r)}
              >
                {r[0].toUpperCase() + r.slice(1)}
                <span className="ct">{counts[r] || 0}</span>
              </button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>View</span>
            <div className="viewswitch">
              {[
                { id: 'grid', icon: 'grid' },
                { id: 'table', icon: 'table' },
              ].map(v => (
                <button
                  key={v.id}
                  className={tweaks.userLayout === v.id ? 'is-on' : ''}
                  onClick={() => setTweak('userLayout', v.id)}
                  title={v.id}
                >
                  <I name={v.icon} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="body">
        <ListView
          users={filtered}
          currentUserId={currentUser?.id}
          sort={sort}
          onSort={onSort}
          onEdit={openEdit}
          onDelete={deleteUser}
          onResetPwd={sendResetPwd}
        />
      </div>

      <UserEditor
        pattern={tweaks.pattern}
        open={editor.open}
        mode={editor.mode}
        initial={editor.initial}
        onSave={saveUser}
        onResetPwd={sendResetPwd}
        onCancel={(why) => {
          if (why === 'delete' && editor.initial) deleteUser(editor.initial);
          else closeEditor();
        }}
      />

      {confirmDel && (
        <>
          <div className="scrim is-open" onClick={() => setConfirmDel(null)} />
          <div className="modal-shell is-open" style={{ zIndex: 110 }}>
            <div className="modal-card" style={{ maxWidth: 460 }}>
              <div className="fhead">
                <div className="fhead-l">
                  <div>
                    <div className="crumb">Confirm</div>
                    <h3>Remove user?</h3>
                  </div>
                </div>
              </div>
              <div className="fbody">
                <p style={{ margin: 0, color: 'var(--ink-2)' }}>
                  Remove <strong style={{ color: 'var(--ink)' }}>{confirmDel.firstName} {confirmDel.lastName}</strong> from the team.
                  They'll lose access immediately. Any items they own (e.g. artist bookings) stay assigned to them.
                </p>
              </div>
              <div className="ffoot">
                <span />
                <div className="ffoot-r">
                  <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancel</button>
                  <button className="btn" style={{ background: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' }} onClick={confirmDelete}>
                    <I name="trash" /> Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className={`toast is-on`}>
          <span>{toast.msg}</span>
          {toast.action && (
            <button
              className="btn btn-sm"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'inherit' }}
              onClick={() => { toast.action.onClick(); setToast(null); }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </>
  );
}

// ── PLACEHOLDER for non-built nav items ─────────────────
function Placeholder({ title, copy }) {
  return (
    <div className="topbar">
      <div className="topbar-head">
        <div>
          <h2>{title}</h2>
          <div className="sub">{copy}</div>
        </div>
      </div>
      <div className="body">
        <div className="empty" style={{ padding: 80 }}>
          <h3 className="ttl">Not in this iteration.</h3>
          <p>Use the sidebar to jump between <strong>Events</strong> and <strong>Artists</strong>.</p>
        </div>
      </div>
    </div>
  );
}

// ── APP shell ──────────────────────────────────────────────
function App() {
  const { Sidebar } = window;
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [active, setActive] = window.useState('dashboard');
  const [unread, setUnread] = window.useState(window.unreadMessageCount());
  const [user, setUser] = window.useState(window.CURRENT_USER);

  window.useEffect(() => {
    document.documentElement.setAttribute('data-aesthetic', t.aesthetic);
  }, [t.aesthetic]);

  return (
    <div className="app">
      <Sidebar
        active={active}
        onNavigate={setActive}
        badges={{ messages: unread }}
        user={user}
      />
      <main className="main">
        {active === 'dashboard' && (
          <window.DashboardPage user={user} onNavigate={setActive} />
        )}
        {active === 'events' && (
          <EventsPage tweaks={t} setTweak={setTweak} />
        )}
        {active === 'artists' && (
          <ArtistsPage tweaks={t} setTweak={setTweak} />
        )}
        {active === 'venues' && (
          <VenuesPage tweaks={t} setTweak={setTweak} />
        )}
        {active === 'gallery' && (
          <GalleryPage tweaks={t} setTweak={setTweak} />
        )}
        {active === 'messages' && (
          <MessagesPage tweaks={t} setTweak={setTweak} onUnreadChange={setUnread} />
        )}
        {active === 'users' && (
          <UsersPage
            tweaks={t}
            setTweak={setTweak}
            currentUser={user}
            onNavigateAccount={() => setActive('account')}
          />
        )}
        {active === 'account' && (
          <window.AccountPage user={user} setUser={setUser} />
        )}
        {!['dashboard', 'events', 'artists', 'venues', 'gallery', 'messages', 'users', 'account'].includes(active) && (
          <Placeholder
            title={active[0].toUpperCase() + active.slice(1)}
            copy="This section isn't built yet in the prototype."
          />
        )}
      </main>

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Aesthetic" />
        <window.TweakRadio
          label="Theme"
          value={t.aesthetic}
          options={['editorial', 'clean', 'dark']}
          onChange={(v) => setTweak('aesthetic', v)}
        />
        <window.TweakSection label="Events list" />
        <window.TweakSelect
          label="Default view"
          value={t.layout}
          options={[
            { value: 'table', label: 'Table — dense rows' },
            { value: 'rows', label: 'Rows — image-led' },
            { value: 'grid', label: 'Poster grid' },
            { value: 'timeline', label: 'Timeline / agenda' },
          ]}
          onChange={(v) => setTweak('layout', v)}
        />
        <window.TweakSection label="Artists list" />
        <window.TweakRadio
          label="Default view"
          value={t.artistLayout}
          options={['grid', 'rows', 'table']}
          onChange={(v) => setTweak('artistLayout', v)}
        />
        <window.TweakSection label="Venues list" />
        <window.TweakRadio
          label="Default view"
          value={t.venueLayout}
          options={['grid', 'rows', 'table']}
          onChange={(v) => setTweak('venueLayout', v)}
        />
        <window.TweakSection label="Gallery" />
        <window.TweakRadio
          label="Default view"
          value={t.galleryLayout}
          options={['masonry', 'rows', 'table']}
          onChange={(v) => setTweak('galleryLayout', v)}
        />
        <window.TweakSection label="Messages" />
        <window.TweakRadio
          label="Default view"
          value={t.messageLayout}
          options={['inbox', 'cards', 'table']}
          onChange={(v) => setTweak('messageLayout', v)}
        />
        <window.TweakSection label="Users" />
        <window.TweakRadio
          label="Default view"
          value={t.userLayout}
          options={['grid', 'table']}
          onChange={(v) => setTweak('userLayout', v)}
        />
        <window.TweakSection label="Create / Edit" />
        <window.TweakRadio
          label="Pattern"
          value={t.pattern}
          options={['modal', 'drawer', 'fullpage']}
          onChange={(v) => setTweak('pattern', v)}
        />
        <div style={{ padding: '6px 0 2px', fontSize: 11, color: 'rgba(41,38,27,.55)', lineHeight: 1.4 }}>
          Switch sections in the sidebar. <strong>N</strong> = new, <strong>Esc</strong> = close.
        </div>
      </window.TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
