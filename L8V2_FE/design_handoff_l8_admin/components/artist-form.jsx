// ArtistForm — schema-aligned: name, bio, imageUrl, socialMedia, genre,
// isBookable, bookingUserId. (createdAt / updatedAt / uuid / embeddings handled automatically.)
const { I, monogram, SOCIAL_PLATFORMS, colorFromName } = window;

function ArtistForm({ initial, onSave, onCancel, mode = 'create', layout = 'modal' }) {
  const [draft, setDraft] = window.useState(() => initial ? {
    ...initial,
    socialMedia: initial.socialMedia || {},
  } : {
    name: '',
    genre: '',
    bio: '',
    imageUrl: '',
    socialMedia: {},
    isBookable: true,
    bookingUserId: 'u-001',
  });
  function set(field, val) { setDraft(d => ({ ...d, [field]: val })); }
  function setSocial(key, val) {
    setDraft(d => ({ ...d, socialMedia: { ...d.socialMedia, [key]: val } }));
  }

  const isValid = draft.name.trim().length > 0;
  const previewColor = window.useMemo(() => colorFromName(draft.name), [draft.name]);

  function submit() {
    if (!isValid) return;
    const cleanedSocial = {};
    for (const [k, v] of Object.entries(draft.socialMedia || {})) {
      if (v && v.trim()) cleanedSocial[k.trim()] = v.trim();
    }
    onSave({
      id: initial?.id,
      uuid: initial?.uuid,
      ...draft,
      socialMedia: cleanedSocial,
      updatedAt: new Date().toISOString().slice(0, 10),
      createdAt: initial?.createdAt || new Date().toISOString().slice(0, 10),
    });
  }

  return (
    <>
      <div className="fbody">
        <div className={layout === 'fullpage' ? 'fp-grid' : 'fbody-grid'}>
          <div className="form-grid">
            <div className="field full field-title">
              <label>Artist name <span className="req">*</span></label>
              <input
                className="input"
                placeholder="e.g. Junior Brown"
                value={draft.name}
                onChange={(e) => set('name', e.target.value)}
                autoFocus
              />
            </div>

            <div className="field full">
              <label>Profile photo</label>
              <div className="art-photo-pick">
                <div
                  className="preview"
                  style={{ '--photo-bg': previewColor, padding: 0, overflow: 'hidden' }}
                >
                  {draft.imageUrl
                    ? <img src={draft.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (monogram(draft.name) || '·')}
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    className="input"
                    placeholder="https://… (paste image URL)"
                    value={draft.imageUrl || ''}
                    onChange={(e) => set('imageUrl', e.target.value)}
                  />
                  <span className="hint" style={{ display: 'block', marginTop: 6 }}>
                    Or drop a file (uploads to storage in production):
                  </span>
                  <div className="dropzone" style={{ padding: '12px 14px', marginTop: 6 }}>
                    <I name="upload" size={20} />
                    <div className="strong">Drop a photo, or click to browse</div>
                    <div>1:1 ratio recommended. JPG / PNG up to 8 MB.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="field full">
              <label>Genre</label>
              <input
                className="input"
                placeholder="Indie, Hip-hop, Electronic…"
                list="genre-list"
                value={draft.genre || ''}
                onChange={(e) => set('genre', e.target.value)}
              />
              <datalist id="genre-list">
                {['Indie','Pop','Hip-hop','Electronic','R&B','Folk','Alt-rock','Punk','Jazz','Singer-songwriter'].map(g => <option key={g} value={g} />)}
              </datalist>
            </div>

            <div className="field full">
              <label>Bio</label>
              <textarea
                className="textarea"
                rows={4}
                placeholder="Short bio for press kits and the public site. 2–4 sentences."
                value={draft.bio || ''}
                onChange={(e) => set('bio', e.target.value)}
              />
            </div>

            <div className="field full">
              <label>Social media</label>
              <div className="social-rows">
                {SOCIAL_PLATFORMS.map(p => (
                  <div className="social-row" key={p.key}>
                    <span className="lbl">
                      <I name={p.icon} /> {p.label}
                    </span>
                    <input
                      className="input"
                      placeholder={p.baseUrl ? `${p.baseUrl}handle` : 'URL or handle'}
                      value={draft.socialMedia?.[p.key] || ''}
                      onChange={(e) => setSocial(p.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <span className="hint">Stored as a JSON object on the artist record.</span>
            </div>

            <div className="field full">
              <label>Booking</label>
              <div className="bookable-toggle" onClick={() => set('isBookable', !draft.isBookable)}>
                <div className="tx">
                  <strong>Available for booking through L8</strong>
                  <span>{draft.isBookable
                    ? 'Visible to clients in the booking marketplace.'
                    : 'Internal only — hidden from booking surfaces.'}</span>
                </div>
                <div className={`switch ${draft.isBookable ? 'is-on' : ''}`} />
              </div>
            </div>

            {draft.isBookable && (
              <div className="field full">
                <label>Booking manager</label>
                <select
                  className="select"
                  value={draft.bookingUserId || ''}
                  onChange={(e) => set('bookingUserId', e.target.value || null)}
                >
                  <option value="">Unassigned</option>
                  {window.BOOKING_USERS.map(u => (
                    <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                  ))}
                </select>
                <span className="hint">This user handles inbound booking requests for the artist.</span>
              </div>
            )}
          </div>

          {layout === 'fullpage' && (
            <aside className="form-preview">
              <h4>Preview</h4>
              <div
                style={{
                  aspectRatio: '1/1',
                  borderRadius: 'var(--r-sm)',
                  background: draft.imageUrl ? 'transparent' : previewColor,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'white',
                  fontFamily: 'var(--font-display)',
                  fontSize: 64,
                  letterSpacing: '-0.02em',
                  overflow: 'hidden',
                }}
              >
                {draft.imageUrl
                  ? <img src={draft.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (monogram(draft.name) || '·')}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1.05, letterSpacing: '-0.015em' }}>
                  {draft.name || 'New artist'}
                </div>
                {draft.genre && (
                  <div style={{ color: 'var(--ink-3)', fontSize: 12.5, marginTop: 4 }}>
                    {draft.genre}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-2)' }}>
                <span style={{ color: 'var(--ink-3)' }}>Bookable</span>
                <window.BookableBadge on={draft.isBookable} compact />
              </div>
              {initial?.uuid && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                  {initial.uuid}
                </div>
              )}
            </aside>
          )}
        </div>
      </div>

      <div className="ffoot">
        <span className="hint">
          {mode === 'edit'
            ? `Last updated ${initial?.updatedAt ? window.fmtDate(initial.updatedAt) : 'never'}.`
            : 'Only a name is required to create.'}
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
            {mode === 'edit' ? 'Save changes' : 'Create artist'}
          </button>
        </div>
      </div>
    </>
  );
}

function ArtistEditor({ pattern, open, mode, initial, onSave, onCancel }) {
  const Header = (
    <div className="fhead">
      <div className="fhead-l">
        <button className="btn btn-ghost btn-icon" onClick={onCancel}><I name="x" /></button>
        <div>
          <div className="crumb">Artists / {mode === 'edit' ? 'Edit' : 'New'}</div>
          <h3>{mode === 'edit' ? (initial?.name || 'Edit artist') : 'New artist'}</h3>
        </div>
      </div>
      <div className="fhead-r"><span className="kbd">Esc</span></div>
    </div>
  );

  if (pattern === 'drawer') {
    return (
      <>
        <div className={`scrim ${open ? 'is-open' : ''}`} onClick={() => onCancel?.()} />
        <div className={`drawer-shell ${open ? 'is-open' : ''}`}>
          <div className="drawer-card">
            {open && <>{Header}<ArtistForm initial={initial} mode={mode} layout="drawer" onSave={onSave} onCancel={onCancel} /></>}
          </div>
        </div>
      </>
    );
  }
  if (pattern === 'fullpage') {
    return (
      <div className={`fp-shell ${open ? 'is-open' : ''}`}>
        {open && <>{Header}<ArtistForm initial={initial} mode={mode} layout="fullpage" onSave={onSave} onCancel={onCancel} /></>}
      </div>
    );
  }
  return (
    <>
      <div className={`scrim ${open ? 'is-open' : ''}`} onClick={() => onCancel?.()} />
      <div className={`modal-shell ${open ? 'is-open' : ''}`}>
        <div className="modal-card">
          {open && <>{Header}<ArtistForm initial={initial} mode={mode} layout="modal" onSave={onSave} onCancel={onCancel} /></>}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { ArtistForm, ArtistEditor });
