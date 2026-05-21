// GalleryForm — schema: filename, url, caption, photographer, isPublished,
// eventId, category. (createdAt / updatedAt / uuid handled automatically.)
const { I, colorFromName } = window;

function GalleryForm({ initial, onSave, onCancel, mode = 'create', layout = 'modal' }) {
  const [draft, setDraft] = window.useState(() => initial ? { ...initial } : {
    filename: '',
    url: '',
    caption: '',
    photographer: '',
    isPublished: false,
    eventId: null,
    category: 'live',
  });
  function set(field, val) { setDraft(d => ({ ...d, [field]: val })); }

  const isValid =
    draft.filename.trim().length > 0 &&
    draft.url.trim().length > 0 &&
    draft.category;

  function submit() {
    if (!isValid) return;
    onSave({
      id: initial?.id,
      uuid: initial?.uuid,
      ...draft,
      updatedAt: new Date().toISOString().slice(0, 10),
      createdAt: initial?.createdAt || new Date().toISOString().slice(0, 10),
    });
  }

  // Auto-fill filename from a pasted URL
  function onUrlChange(val) {
    set('url', val);
    if (!draft.filename) {
      const last = val.split(/[\/?#]/).filter(Boolean).pop();
      if (last && /\.[a-z]{2,4}$/i.test(last)) {
        set('filename', last);
      }
    }
  }

  const photographers = window.photographerList();
  const previewColor = colorFromName(draft.filename || 'preview');

  return (
    <>
      <div className="fbody">
        <div className={layout === 'fullpage' ? 'fp-grid' : 'fbody-grid'}>
          <div className="form-grid">
            <div className="field full field-title">
              <label>Filename <span className="req">*</span></label>
              <input
                className="input"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 18 }}
                placeholder="distortion_dj.jpg"
                value={draft.filename}
                onChange={(e) => set('filename', e.target.value)}
                autoFocus
              />
            </div>

            <div className="field full">
              <label>URL <span className="req">*</span></label>
              <input
                className="input"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
                placeholder="https://cdn.l8events.dk/g/…"
                value={draft.url}
                onChange={(e) => onUrlChange(e.target.value)}
              />
              <div className="dropzone" style={{ marginTop: 8 }}>
                <I name="upload" size={20} />
                <div className="strong">Drop photo, or click to browse</div>
                <div>JPG / PNG / WebP up to 12 MB. Uploaded files become the URL.</div>
              </div>
              {draft.url && (
                <div style={{
                  marginTop: 10,
                  aspectRatio: 1.5,
                  maxWidth: 280,
                  borderRadius: 'var(--r-sm)',
                  background: `repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 10px), ${previewColor}`,
                  color: 'white',
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em',
                  textTransform: 'uppercase', opacity: 0.7,
                }}>
                  [ photo preview ]
                </div>
              )}
            </div>

            <div className="field full">
              <label>Caption</label>
              <input
                className="input"
                placeholder="What's happening in the photo? (optional)"
                value={draft.caption || ''}
                onChange={(e) => set('caption', e.target.value)}
              />
            </div>

            <div className="field">
              <label>Photographer</label>
              <input
                className="input"
                list="photographer-list"
                placeholder="Photographer name"
                value={draft.photographer || ''}
                onChange={(e) => set('photographer', e.target.value)}
              />
              <datalist id="photographer-list">
                {photographers.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>

            <div className="field">
              <label>Category <span className="req">*</span></label>
              <div className="seg" style={{ flexWrap: 'wrap' }}>
                {window.GALLERY_CATEGORIES.map(c => (
                  <button
                    key={c}
                    className={draft.category === c ? 'is-on' : ''}
                    onClick={() => set('category', c)}
                  >{c}</button>
                ))}
              </div>
            </div>

            <div className="field full">
              <label>Linked event</label>
              <select
                className="select"
                value={draft.eventId || ''}
                onChange={(e) => set('eventId', e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Not linked to any event</option>
                {window.EVENTS.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} — {window.fmtDate(ev.date)}
                  </option>
                ))}
              </select>
              <span className="hint">Optional. Linking groups this photo with the event's gallery.</span>
            </div>

            <div className="field full">
              <label>Publishing</label>
              <div className="bookable-toggle" onClick={() => set('isPublished', !draft.isPublished)}>
                <div className="tx">
                  <strong>{draft.isPublished ? 'Published' : 'Draft'}</strong>
                  <span>{draft.isPublished
                    ? 'Visible in the public gallery.'
                    : 'Hidden from the public gallery. Visible to admins only.'}</span>
                </div>
                <div className={`switch ${draft.isPublished ? 'is-on' : ''}`} />
              </div>
            </div>
          </div>

          {layout === 'fullpage' && (
            <aside className="form-preview">
              <h4>Preview</h4>
              <div style={{
                aspectRatio: 1.2,
                borderRadius: 'var(--r-sm)',
                background: `repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 10px), ${previewColor}`,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 10, right: 10, fontFamily: 'var(--font-mono)', fontSize: 9, padding: '4px 8px', background: 'rgba(0,0,0,0.4)', borderRadius: 3, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {draft.category}
                </div>
                {!draft.isPublished && (
                  <div style={{ position: 'absolute', bottom: 10, left: 10, fontFamily: 'var(--font-mono)', fontSize: 9, padding: '4px 8px', background: 'rgba(255,200,80,0.95)', color: '#1a1408', borderRadius: 3, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>
                    Draft
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 500, wordBreak: 'break-all' }}>
                  {draft.filename || 'filename.jpg'}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.45 }}>
                  {draft.caption || <span style={{ color: 'var(--ink-3)' }}>No caption</span>}
                </div>
              </div>
              {draft.photographer && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--ink-3)' }}>Photographer</span>
                  <span>{draft.photographer}</span>
                </div>
              )}
              {draft.eventId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, gap: 12 }}>
                  <span style={{ color: 'var(--ink-3)', flexShrink: 0 }}>Event</span>
                  <span style={{ textAlign: 'right' }}>{window.eventById(draft.eventId)?.title}</span>
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
            : 'Required: filename, URL, category.'}
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
            {mode === 'edit' ? 'Save changes' : 'Upload photo'}
          </button>
        </div>
      </div>
    </>
  );
}

function GalleryEditor({ pattern, open, mode, initial, onSave, onCancel }) {
  const Header = (
    <div className="fhead">
      <div className="fhead-l">
        <button className="btn btn-ghost btn-icon" onClick={onCancel}><I name="x" /></button>
        <div>
          <div className="crumb">Gallery / {mode === 'edit' ? 'Edit' : 'Upload'}</div>
          <h3>{mode === 'edit' ? (initial?.filename || 'Edit photo') : 'Upload photo'}</h3>
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
            {open && <>{Header}<GalleryForm initial={initial} mode={mode} layout="drawer" onSave={onSave} onCancel={onCancel} /></>}
          </div>
        </div>
      </>
    );
  }
  if (pattern === 'fullpage') {
    return (
      <div className={`fp-shell ${open ? 'is-open' : ''}`}>
        {open && <>{Header}<GalleryForm initial={initial} mode={mode} layout="fullpage" onSave={onSave} onCancel={onCancel} /></>}
      </div>
    );
  }
  return (
    <>
      <div className={`scrim ${open ? 'is-open' : ''}`} onClick={() => onCancel?.()} />
      <div className={`modal-shell ${open ? 'is-open' : ''}`}>
        <div className="modal-card">
          {open && <>{Header}<GalleryForm initial={initial} mode={mode} layout="modal" onSave={onSave} onCancel={onCancel} /></>}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { GalleryForm, GalleryEditor });
