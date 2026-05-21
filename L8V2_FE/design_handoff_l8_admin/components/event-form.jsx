// EventForm — shared form contents used by all 3 create/edit patterns.
// Owns its own draft state; calls onSave / onCancel.

const { I, useState, useMemo, useRef, useEffect } = window;

function ArtistCombobox({ value, onChange }) {
  const [q, setQ] = window.useState('');
  const [open, setOpen] = window.useState(false);
  const [activeIdx, setActiveIdx] = window.useState(0);
  const ref = window.useRef(null);
  const inputRef = window.useRef(null);

  window.useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const filtered = window.ARTISTS.filter(a =>
    a.name.toLowerCase().includes(q.toLowerCase())
  );
  const selectedSet = new Set(value);

  function add(id) {
    if (!selectedSet.has(id)) onChange([...value, id]);
    setQ('');
    inputRef.current?.focus();
  }
  function remove(id) {
    onChange(value.filter(v => v !== id));
  }
  function onKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const target = filtered[activeIdx];
      if (target) add(target.id);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
      setOpen(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Backspace' && q === '' && value.length > 0) {
      remove(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="combobox" ref={ref}>
      <div
        className={`combo-input ${open ? 'is-focus' : ''}`}
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        {value.map(id => {
          const a = window.ARTISTS.find(x => x.id === id);
          if (!a) return null;
          return (
            <span className="chip-sel" key={id}>
              {a.name}
              <button onClick={(e) => { e.stopPropagation(); remove(id); }}>
                <I name="x" />
              </button>
            </span>
          );
        })}
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActiveIdx(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={value.length === 0 ? 'Type to search artists…' : 'Add another…'}
        />
      </div>
      {open && (
        <div className="combo-pop">
          {filtered.length === 0 ? (
            <div className="empty-line">No artists match “{q}”. Press <kbd>+</kbd> to create.</div>
          ) : filtered.map((a, i) => {
            const sel = selectedSet.has(a.id);
            return (
              <div
                key={a.id}
                className={`combo-opt ${i === activeIdx ? 'is-active' : ''} ${sel ? 'is-selected' : ''}`}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => sel ? remove(a.id) : add(a.id)}
              >
                <span>{a.name} <span className="g">· {a.genre}</span></span>
                {sel && <span className="check"><I name="check" size={14} /></span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EventForm({ initial, onSave, onCancel, mode = 'create', layout = 'modal' }) {
  const [draft, setDraft] = window.useState(() => initial || {
    title: '',
    artistIds: [],
    date: '',
    time: '20:00',
    endTime: '',
    venueId: null,
    status: 'upcoming',
    description: '',
    capacity: 320,
    price: 200,
    posterPalette: ['#E0623C', '#0c0d12'],
  });
  function set(field, val) { setDraft(d => ({ ...d, [field]: val })); }

  const preview = window.useMemo(() => ({
    ...draft,
    sold: 0,
    date: draft.date || '2026-01-01',
    title: draft.title || 'New event',
  }), [draft]);

  const isValid = draft.title && draft.date && draft.artistIds.length > 0 && draft.venueId;

  function submit() {
    if (!isValid) return;
    onSave({
      id: initial?.id,
      ...draft,
      sold: initial?.sold ?? 0,
    });
  }

  return (
    <>
      <div className="fbody">
        <div className={layout === 'fullpage' ? 'fp-grid' : 'fbody-grid'}>
          <div className="form-grid">
            <div className="field full field-title">
              <label>Event title <span className="req">*</span></label>
              <input
                className="input"
                placeholder="e.g. Olivver — Album Release"
                value={draft.title}
                onChange={(e) => set('title', e.target.value)}
                autoFocus
              />
            </div>

            <div className="field full">
              <label>Artists <span className="req">*</span></label>
              <ArtistCombobox
                value={draft.artistIds}
                onChange={(ids) => set('artistIds', ids)}
              />
              <span className="hint">Type to filter. Click to add or remove. Backspace to remove last.</span>
            </div>

            <div className="field full">
              <label>Schedule <span className="req">*</span></label>
              <div className="dt-pair">
                <input
                  type="date"
                  className="input"
                  value={draft.date}
                  onChange={(e) => set('date', e.target.value)}
                />
                <input
                  type="time"
                  className="input"
                  value={draft.time}
                  onChange={(e) => set('time', e.target.value)}
                />
                <input
                  type="time"
                  className="input"
                  placeholder="End"
                  value={draft.endTime || ''}
                  onChange={(e) => set('endTime', e.target.value)}
                />
              </div>
              <span className="hint">Start — end is optional.</span>
            </div>

            <div className="field">
              <label>Venue <span className="req">*</span></label>
              <select
                className="select"
                value={draft.venueId || ''}
                onChange={(e) => set('venueId', e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Select venue…</option>
                {window.VENUES.map(v => (
                  <option key={v.id} value={v.id}>{v.name} — {v.city}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Status</label>
              <div className="seg">
                {['draft', 'upcoming', 'completed', 'cancelled'].map(s => (
                  <button
                    key={s}
                    className={draft.status === s ? 'is-on' : ''}
                    onClick={() => set('status', s)}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Capacity</label>
              <input
                type="number"
                className="input"
                value={draft.capacity}
                onChange={(e) => set('capacity', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="field">
              <label>Ticket price (DKK)</label>
              <input
                type="number"
                className="input"
                value={draft.price}
                onChange={(e) => set('price', parseInt(e.target.value) || 0)}
              />
              <span className="hint">Set 0 for free events.</span>
            </div>

            <div className="field full">
              <label>Description</label>
              <textarea
                className="textarea"
                rows={4}
                placeholder="Doors, supports, set times, special notes…"
                value={draft.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>

            <div className="field full">
              <label>Poster</label>
              <div className="dropzone">
                <I name="upload" size={22} />
                <div className="strong">Drop a poster image, or click to browse</div>
                <div>JPG / PNG / WebP up to 8 MB. 4:5 ratio recommended.</div>
              </div>
            </div>
          </div>

          {layout === 'fullpage' && (
            <aside className="form-preview">
              <h4>Preview</h4>
              <div
                className="fp-tile"
                style={{
                  '--poster-bg': preview.posterPalette?.[0] || '#1c1b18',
                }}
              >
                <div className="d">{window.fmtDate(preview.date)} · {preview.time}</div>
                <h3 className="t">{preview.title}</h3>
                <div className="a">
                  {window.artistsById(preview.artistIds).slice(0, 4).map(a => a.name).join(' · ') || 'No artists yet'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5, color: 'var(--ink-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-3)' }}>Venue</span>
                  <span>{window.venueById(preview.venueId)?.name || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-3)' }}>Capacity</span>
                  <span>{preview.capacity?.toLocaleString() || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-3)' }}>Price</span>
                  <span>{preview.price ? `${preview.price} DKK` : 'Free'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-3)' }}>Status</span>
                  <window.StatusPill status={preview.status} />
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      <div className="ffoot">
        <span className="hint">
          {mode === 'edit'
            ? 'Changes save instantly.'
            : <>Required: title, artists, date, venue.</>
          }
        </span>
        <div className="ffoot-r">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          {mode === 'edit' && (
            <button className="btn btn-danger" onClick={() => onCancel?.('delete')}>
              <I name="trash" /> Delete
            </button>
          )}
          <button
            className="btn btn-primary"
            disabled={!isValid}
            style={!isValid ? { opacity: 0.5 } : {}}
            onClick={submit}
          >
            {mode === 'edit' ? 'Save changes' : 'Create event'}
          </button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { EventForm, ArtistCombobox });
