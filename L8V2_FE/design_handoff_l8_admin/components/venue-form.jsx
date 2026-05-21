// VenueForm — schema: name, address, city, description, mapEmbedHtml
// (createdAt / updatedAt / uuid handled automatically.)
const { I, MapPlaceholder, extractMapSrc } = window;

function VenueForm({ initial, onSave, onCancel, mode = 'create', layout = 'modal' }) {
  const [draft, setDraft] = window.useState(() => initial ? { ...initial } : {
    name: '',
    address: '',
    city: 'Copenhagen',
    description: '',
    mapEmbedHtml: '',
  });
  function set(field, val) { setDraft(d => ({ ...d, [field]: val })); }

  const isValid = draft.name.trim().length > 0 && draft.address.trim().length > 0;

  const previewSrc = window.useMemo(
    () => extractMapSrc(draft.mapEmbedHtml || ''),
    [draft.mapEmbedHtml]
  );

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

  return (
    <>
      <div className="fbody">
        <div className={layout === 'fullpage' ? 'fp-grid' : 'fbody-grid'}>
          <div className="form-grid">
            <div className="field full field-title">
              <label>Venue name <span className="req">*</span></label>
              <input
                className="input"
                placeholder="e.g. VEGA"
                value={draft.name}
                onChange={(e) => set('name', e.target.value)}
                autoFocus
              />
            </div>

            <div className="field full">
              <label>Address <span className="req">*</span></label>
              <input
                className="input"
                placeholder="Street, number, postal code, city"
                value={draft.address}
                onChange={(e) => set('address', e.target.value)}
              />
              <span className="hint">Full street address — used for directions and map.</span>
            </div>

            <div className="field full">
              <label>City</label>
              <input
                className="input"
                placeholder="Copenhagen"
                value={draft.city || ''}
                onChange={(e) => set('city', e.target.value)}
                list="city-list"
              />
              <datalist id="city-list">
                {['Copenhagen','Aarhus','Odense','Aalborg','Roskilde','Esbjerg','Helsingør'].map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div className="field full">
              <label>Description</label>
              <textarea
                className="textarea"
                rows={4}
                placeholder="Layout, sound system, accessibility, vibe — anything that helps when planning a show."
                value={draft.description || ''}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>

            <div className="field full">
              <label>Map embed</label>
              <textarea
                className="textarea"
                rows={3}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                placeholder='<iframe src="https://www.google.com/maps/embed?..." …></iframe>'
                value={draft.mapEmbedHtml || ''}
                onChange={(e) => set('mapEmbedHtml', e.target.value)}
              />
              <span className="hint">Paste the embed HTML from Google Maps or OpenStreetMap. Only the iframe src is rendered.</span>
              <div className="map-preview" style={{ marginTop: 10 }}>
                {previewSrc ? (
                  <iframe src={previewSrc} title="Map preview" sandbox="allow-scripts allow-same-origin allow-popups" />
                ) : draft.mapEmbedHtml ? (
                  <div className="map-empty">
                    <div>
                      Could not detect an iframe src.<br />
                      <small style={{ color: 'var(--ink-3)' }}>Paste the full <code>&lt;iframe …&gt;&lt;/iframe&gt;</code> tag.</small>
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'absolute', inset: 0 }}>
                    <MapPlaceholder venue={{ id: initial?.id || 99, name: draft.name || 'new' }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {layout === 'fullpage' && (
            <aside className="form-preview">
              <h4>Preview</h4>
              <div style={{
                aspectRatio: '16/10',
                borderRadius: 'var(--r-sm)',
                position: 'relative',
                overflow: 'hidden',
                background: 'oklch(0.94 0.012 75)',
              }}>
                {previewSrc ? (
                  <iframe src={previewSrc} title="Map preview" style={{ width: '100%', height: '100%', border: 0 }} sandbox="allow-scripts allow-same-origin allow-popups" />
                ) : (
                  <MapPlaceholder venue={{ id: initial?.id || 99, name: draft.name || 'new' }} />
                )}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1.1, letterSpacing: '-0.015em' }}>
                  {draft.name || 'New venue'}
                </div>
                <div style={{ color: 'var(--ink-2)', fontSize: 12.5, marginTop: 4, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <I name="pin" /> <span>{draft.address || 'Address required'}{draft.city ? `, ${draft.city}` : ''}</span>
                </div>
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
            : 'Required: name and address.'}
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
            {mode === 'edit' ? 'Save changes' : 'Create venue'}
          </button>
        </div>
      </div>
    </>
  );
}

function VenueEditor({ pattern, open, mode, initial, onSave, onCancel }) {
  const Header = (
    <div className="fhead">
      <div className="fhead-l">
        <button className="btn btn-ghost btn-icon" onClick={onCancel}><I name="x" /></button>
        <div>
          <div className="crumb">Venues / {mode === 'edit' ? 'Edit' : 'New'}</div>
          <h3>{mode === 'edit' ? (initial?.name || 'Edit venue') : 'New venue'}</h3>
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
            {open && <>{Header}<VenueForm initial={initial} mode={mode} layout="drawer" onSave={onSave} onCancel={onCancel} /></>}
          </div>
        </div>
      </>
    );
  }
  if (pattern === 'fullpage') {
    return (
      <div className={`fp-shell ${open ? 'is-open' : ''}`}>
        {open && <>{Header}<VenueForm initial={initial} mode={mode} layout="fullpage" onSave={onSave} onCancel={onCancel} /></>}
      </div>
    );
  }
  return (
    <>
      <div className={`scrim ${open ? 'is-open' : ''}`} onClick={() => onCancel?.()} />
      <div className={`modal-shell ${open ? 'is-open' : ''}`}>
        <div className="modal-card">
          {open && <>{Header}<VenueForm initial={initial} mode={mode} layout="modal" onSave={onSave} onCancel={onCancel} /></>}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { VenueForm, VenueEditor });
