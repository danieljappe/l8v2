// UserForm — invite a new team member or edit an existing one.
// Schema fields used: firstName, lastName, email, role, phoneNumber, imageUrl.
// Password is NEVER set by the admin — invite flow on create, reset link on edit.
const { I, monogram, colorFromName } = window;

function UserForm({ initial, onSave, onCancel, onResetPwd, mode = 'create', layout = 'modal' }) {
  const [draft, setDraft] = window.useState(() => initial ? { ...initial } : {
    firstName: '',
    lastName: '',
    email: '',
    role: 'editor',
    phoneNumber: '',
    imageUrl: '',
    sendInvite: true,
  });
  function set(field, val) { setDraft(d => ({ ...d, [field]: val })); }

  const isValid =
    draft.firstName.trim().length > 0 &&
    draft.lastName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email);

  const previewName = `${draft.firstName} ${draft.lastName}`.trim() || 'New user';
  const previewBg = colorFromName(previewName);

  function submit() {
    if (!isValid) return;
    onSave({
      id: initial?.id,
      uuid: initial?.uuid,
      ...draft,
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      email: draft.email.trim(),
      phoneNumber: draft.phoneNumber?.trim() || null,
      imageUrl: draft.imageUrl?.trim() || null,
      updatedAt: new Date().toISOString().slice(0, 10),
      createdAt: initial?.createdAt || new Date().toISOString().slice(0, 10),
    });
  }

  return (
    <>
      <div className="fbody">
        <div className={layout === 'fullpage' ? 'fp-grid' : 'fbody-grid'}>
          <div className="form-grid">
            <div className="field full">
              <label>Profile photo</label>
              <div className="art-photo-pick">
                <div
                  className="preview"
                  style={{
                    '--photo-bg': previewBg,
                    borderRadius: '50%',
                    padding: 0,
                    overflow: 'hidden',
                  }}
                >
                  {draft.imageUrl
                    ? <img src={draft.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : monogram(previewName)}
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    className="input"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
                    placeholder="https://… (paste image URL)"
                    value={draft.imageUrl || ''}
                    onChange={(e) => set('imageUrl', e.target.value)}
                  />
                  <div className="dropzone" style={{ padding: '12px 14px', marginTop: 6 }}>
                    <I name="upload" size={20} />
                    <div className="strong">Drop a photo, or click to browse</div>
                    <div>1:1 ratio recommended.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="field">
              <label>First name <span className="req">*</span></label>
              <input
                className="input"
                value={draft.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                autoFocus
              />
            </div>
            <div className="field">
              <label>Last name <span className="req">*</span></label>
              <input
                className="input"
                value={draft.lastName}
                onChange={(e) => set('lastName', e.target.value)}
              />
            </div>

            <div className="field full">
              <label>Email <span className="req">*</span></label>
              <input
                type="email"
                className="input"
                value={draft.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="name@l8events.dk"
              />
              <span className="hint">Used to sign in. Must be unique.</span>
            </div>

            <div className="field">
              <label>Role <span className="req">*</span></label>
              <select
                className="select"
                value={draft.role}
                onChange={(e) => set('role', e.target.value)}
              >
                {window.USER_ROLES.map(r => (
                  <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
              <span className="hint">
                {draft.role === 'admin'   && 'Full access — can manage users and billing.'}
                {draft.role === 'manager' && 'Can create and edit events, artists, venues, gallery.'}
                {draft.role === 'editor'  && 'Can edit content but not delete, and no team access.'}
                {draft.role === 'viewer'  && 'Read-only access to all sections.'}
              </span>
            </div>

            <div className="field">
              <label>Phone number</label>
              <input
                type="tel"
                className="input"
                value={draft.phoneNumber || ''}
                onChange={(e) => set('phoneNumber', e.target.value)}
                placeholder="+45 …"
              />
            </div>

            {mode === 'create' && (
              <div className="field full">
                <label>Onboarding</label>
                <div
                  className="bookable-toggle"
                  onClick={() => set('sendInvite', !draft.sendInvite)}
                >
                  <div className="tx">
                    <strong>Send invite email</strong>
                    <span>{draft.sendInvite
                      ? 'They\'ll get an email with a link to set their password.'
                      : 'You\'ll need to share login instructions manually.'}</span>
                  </div>
                  <div className={`switch ${draft.sendInvite ? 'is-on' : ''}`} />
                </div>
              </div>
            )}

            {mode === 'edit' && (
              <div className="field full">
                <label>Password</label>
                <div className="bookable-toggle" style={{ cursor: 'default' }}>
                  <div className="tx">
                    <strong>Reset password</strong>
                    <span>Sends a password-reset link to {draft.email || 'their email'}. Admins never see passwords.</span>
                  </div>
                  <button
                    className="btn"
                    onClick={(e) => { e.stopPropagation(); onResetPwd?.(initial); }}
                  >
                    <I name="shield" /> Send reset link
                  </button>
                </div>
              </div>
            )}
          </div>

          {layout === 'fullpage' && (
            <aside className="form-preview">
              <h4>Preview</h4>
              <div style={{
                width: 120, height: 120, borderRadius: '50%',
                background: draft.imageUrl ? 'transparent' : previewBg,
                color: 'white',
                display: 'grid', placeItems: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: 48, letterSpacing: '-0.02em', lineHeight: 1,
                overflow: 'hidden',
                margin: '0 auto',
              }}>
                {draft.imageUrl
                  ? <img src={draft.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : monogram(previewName)}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1.1, letterSpacing: '-0.015em' }}>
                  {previewName}
                </div>
                <div style={{ marginTop: 8 }}>
                  <span className="role-pill role-pill-sm">{draft.role}</span>
                </div>
                <div style={{ color: 'var(--ink-3)', fontSize: 12.5, marginTop: 8, fontFamily: 'var(--font-mono)' }}>
                  {draft.email || 'name@l8events.dk'}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      <div className="ffoot">
        <span className="hint">
          {mode === 'edit'
            ? `Last updated ${initial?.updatedAt ? window.fmtDate(initial.updatedAt) : 'never'}.`
            : 'Required: name, email, role.'}
        </span>
        <div className="ffoot-r">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          {mode === 'edit' && (
            <button className="btn btn-danger" onClick={() => onCancel?.('delete')}>
              <I name="trash" /> Remove
            </button>
          )}
          <button
            className="btn btn-primary"
            disabled={!isValid}
            style={!isValid ? { opacity: 0.5 } : {}}
            onClick={submit}
          >
            {mode === 'edit' ? 'Save changes' : (draft.sendInvite ? 'Send invite' : 'Add user')}
          </button>
        </div>
      </div>
    </>
  );
}

function UserEditor({ pattern, open, mode, initial, onSave, onCancel, onResetPwd }) {
  const Header = (
    <div className="fhead">
      <div className="fhead-l">
        <button className="btn btn-ghost btn-icon" onClick={onCancel}><I name="x" /></button>
        <div>
          <div className="crumb">Users / {mode === 'edit' ? 'Edit' : 'Invite'}</div>
          <h3>{mode === 'edit'
            ? `${initial?.firstName || ''} ${initial?.lastName || ''}`.trim() || 'Edit user'
            : 'Invite a new user'}</h3>
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
            {open && <>{Header}<UserForm initial={initial} mode={mode} layout="drawer" onSave={onSave} onCancel={onCancel} onResetPwd={onResetPwd} /></>}
          </div>
        </div>
      </>
    );
  }
  if (pattern === 'fullpage') {
    return (
      <div className={`fp-shell ${open ? 'is-open' : ''}`}>
        {open && <>{Header}<UserForm initial={initial} mode={mode} layout="fullpage" onSave={onSave} onCancel={onCancel} onResetPwd={onResetPwd} /></>}
      </div>
    );
  }
  return (
    <>
      <div className={`scrim ${open ? 'is-open' : ''}`} onClick={() => onCancel?.()} />
      <div className={`modal-shell ${open ? 'is-open' : ''}`}>
        <div className="modal-card">
          {open && <>{Header}<UserForm initial={initial} mode={mode} layout="modal" onSave={onSave} onCancel={onCancel} onResetPwd={onResetPwd} /></>}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { UserForm, UserEditor });
