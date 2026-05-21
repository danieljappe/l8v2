// Account — profile editor for the current logged-in user.
// Schema fields: firstName, lastName, email, role, phoneNumber, imageUrl, password.
// (createdAt / updatedAt / uuid are read-only metadata.)
// `address` is rendered but flagged as not-in-current-schema.

const { I, monogram, colorFromName } = window;

function fullName(u) {
  return [u.firstName, u.lastName].filter(Boolean).join(' ');
}

function passwordStrength(pwd) {
  if (!pwd) return { score: 0, label: '', cls: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { score, label: 'weak',   cls: 'weak'   };
  if (score <= 3) return { score, label: 'medium', cls: 'med'    };
  return                  { score, label: 'strong', cls: 'strong' };
}

function PwdInput({ value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = window.useState(false);
  return (
    <div className="pwd-input-wrap">
      <input
        type={show ? 'text' : 'password'}
        className="input"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="toggle"
        onClick={() => setShow(s => !s)}
        title={show ? 'Hide' : 'Show'}
      >
        <I name="eye" size={14} />
      </button>
    </div>
  );
}

function AccountPage({ user: userProp, setUser: setUserProp }) {
  const [localUser, setLocalUser] = window.useState(window.CURRENT_USER);
  const user = userProp || localUser;
  const setUser = setUserProp || setLocalUser;
  // Profile section draft
  const [profile, setProfile] = window.useState({
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    imageUrl: user.imageUrl || '',
  });
  // Contact section draft
  const [contact, setContact] = window.useState({
    email: user.email,
    phoneNumber: user.phoneNumber || '',
    address: user.address || '',
  });
  // Password section
  const [pwd, setPwd] = window.useState({ current: '', next: '', confirm: '' });

  const [savedSection, setSavedSection] = window.useState(null);
  const [toast, setToast] = window.useState(null);
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }
  function flashSaved(key) {
    setSavedSection(key);
    setTimeout(() => setSavedSection(null), 1800);
  }

  // dirty checks
  const profileDirty =
    profile.firstName !== user.firstName ||
    profile.lastName  !== user.lastName  ||
    profile.role      !== user.role      ||
    (profile.imageUrl || null) !== (user.imageUrl || null);
  const contactDirty =
    contact.email       !== user.email ||
    contact.phoneNumber !== (user.phoneNumber || '') ||
    contact.address     !== (user.address || '');

  function saveProfile() {
    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      showToast('First and last name are required.');
      return;
    }
    setUser(u => ({
      ...u,
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      role: profile.role,
      imageUrl: profile.imageUrl.trim() || null,
      updatedAt: new Date().toISOString().slice(0, 10),
    }));
    flashSaved('profile');
  }
  function saveContact() {
    if (!contact.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      showToast('Enter a valid email.');
      return;
    }
    setUser(u => ({
      ...u,
      email: contact.email.trim(),
      phoneNumber: contact.phoneNumber.trim() || null,
      address: contact.address.trim() || null,
      updatedAt: new Date().toISOString().slice(0, 10),
    }));
    flashSaved('contact');
  }

  const ps = passwordStrength(pwd.next);
  const pwdValid =
    pwd.current.length > 0 &&
    pwd.next.length >= 8 &&
    pwd.next === pwd.confirm &&
    pwd.next !== pwd.current;
  function savePassword() {
    if (!pwd.current) { showToast('Enter your current password.'); return; }
    if (pwd.next.length < 8) { showToast('New password must be at least 8 characters.'); return; }
    if (pwd.next !== pwd.confirm) { showToast('New passwords don\'t match.'); return; }
    if (pwd.next === pwd.current) { showToast('New password must differ from current.'); return; }
    setUser(u => ({ ...u, updatedAt: new Date().toISOString().slice(0, 10) }));
    setPwd({ current: '', next: '', confirm: '' });
    flashSaved('password');
    showToast('Password updated.');
  }

  const photoBg = colorFromName(fullName(user));

  return (
    <>
      <div className="topbar">
        <div className="topbar-head">
          <div>
            <h2>Account</h2>
            <div className="sub">Manage your profile, contact information, and password.</div>
          </div>
        </div>
      </div>

      <div className="body">
        <div className="acct-grid">
          {/* ── Side card ───────────────────────────── */}
          <aside className="acct-side">
            <div className="acct-photo" style={{ background: photoBg }}>
              {user.imageUrl
                ? <img src={user.imageUrl} alt={fullName(user)} />
                : monogram(fullName(user))}
              <div className="change-overlay">Change photo</div>
            </div>
            <h2 className="acct-name">{fullName(user)}</h2>
            <p className="acct-email">{user.email}</p>
            <span className="role-pill">{user.role}</span>
            <div className="acct-meta">
              <div className="ml-row"><span className="k">User ID</span><span className="v mono">{user.uuid}</span></div>
              <div className="ml-row"><span className="k">Member since</span><span className="v">{window.fmtDate(user.createdAt)}</span></div>
              <div className="ml-row"><span className="k">Last updated</span><span className="v">{window.fmtDate(user.updatedAt)}</span></div>
            </div>
          </aside>

          {/* ── Main content ───────────────────────── */}
          <div className="acct-main">
            {/* PROFILE ─────────────────────────────── */}
            <section className="acct-section">
              <div className="sec-head">
                <div>
                  <h3>Profile</h3>
                  <div className="sub">Name, role, and avatar.</div>
                </div>
              </div>
              <div className="sec-body">
                <div className="field">
                  <label>First name <span className="req">*</span></label>
                  <input
                    className="input"
                    value={profile.firstName}
                    onChange={(e) => setProfile(p => ({ ...p, firstName: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label>Last name <span className="req">*</span></label>
                  <input
                    className="input"
                    value={profile.lastName}
                    onChange={(e) => setProfile(p => ({ ...p, lastName: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label>Role <span className="req">*</span></label>
                  <select
                    className="select"
                    value={profile.role}
                    onChange={(e) => setProfile(p => ({ ...p, role: e.target.value }))}
                  >
                    {window.USER_ROLES.map(r => (
                      <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                  <span className="hint">Controls what you can see and edit across the admin panel.</span>
                </div>
                <div className="field">
                  <label>Profile photo URL</label>
                  <input
                    className="input"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
                    placeholder="https://…"
                    value={profile.imageUrl}
                    onChange={(e) => setProfile(p => ({ ...p, imageUrl: e.target.value }))}
                  />
                  <span className="hint">Or drop a file below (1:1 ratio recommended).</span>
                </div>
                <div className="field full">
                  <div className="dropzone">
                    <I name="upload" size={20} />
                    <div className="strong">Upload a new photo</div>
                    <div>JPG / PNG / WebP up to 4 MB.</div>
                  </div>
                </div>
              </div>
              <div className="sec-foot">
                <span className={`saved ${savedSection === 'profile' ? 'is-on' : ''}`}>
                  <I name="check" /> Saved.
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setProfile({
                      firstName: user.firstName,
                      lastName: user.lastName,
                      role: user.role,
                      imageUrl: user.imageUrl || '',
                    })}
                    disabled={!profileDirty}
                    style={!profileDirty ? { opacity: 0.5 } : {}}
                  >Revert</button>
                  <button
                    className="btn btn-primary"
                    onClick={saveProfile}
                    disabled={!profileDirty}
                    style={!profileDirty ? { opacity: 0.5 } : {}}
                  >Save changes</button>
                </div>
              </div>
            </section>

            {/* CONTACT ─────────────────────────────── */}
            <section className="acct-section">
              <div className="sec-head">
                <div>
                  <h3>Contact</h3>
                  <div className="sub">Email, phone, and address. Email is the login.</div>
                </div>
              </div>
              <div className="sec-body">
                <div className="field full">
                  <label>Email <span className="req">*</span></label>
                  <input
                    type="email"
                    className="input"
                    value={contact.email}
                    onChange={(e) => setContact(c => ({ ...c, email: e.target.value }))}
                    autoComplete="email"
                  />
                  <span className="hint">Changing this will require you to verify the new address on next sign-in.</span>
                </div>
                <div className="field full">
                  <label>Phone number</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+45 …"
                    value={contact.phoneNumber}
                    onChange={(e) => setContact(c => ({ ...c, phoneNumber: e.target.value }))}
                    autoComplete="tel"
                  />
                </div>
                <div className="field full">
                  <label>
                    Address
                    <span className="schema-note" title="address column not in current users table">+ schema</span>
                  </label>
                  <input
                    className="input"
                    placeholder="Street, postal code, city"
                    value={contact.address}
                    onChange={(e) => setContact(c => ({ ...c, address: e.target.value }))}
                    autoComplete="street-address"
                  />
                  <span className="hint">Heads up: the users table doesn't have an <code>address</code> column yet — needs a migration to persist.</span>
                </div>
              </div>
              <div className="sec-foot">
                <span className={`saved ${savedSection === 'contact' ? 'is-on' : ''}`}>
                  <I name="check" /> Saved.
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setContact({
                      email: user.email,
                      phoneNumber: user.phoneNumber || '',
                      address: user.address || '',
                    })}
                    disabled={!contactDirty}
                    style={!contactDirty ? { opacity: 0.5 } : {}}
                  >Revert</button>
                  <button
                    className="btn btn-primary"
                    onClick={saveContact}
                    disabled={!contactDirty}
                    style={!contactDirty ? { opacity: 0.5 } : {}}
                  >Save changes</button>
                </div>
              </div>
            </section>

            {/* PASSWORD ────────────────────────────── */}
            <section className="acct-section">
              <div className="sec-head">
                <div>
                  <h3>Password</h3>
                  <div className="sub">Change your password. Use at least 8 characters.</div>
                </div>
              </div>
              <div className="sec-body">
                <div className="field full">
                  <label>Current password <span className="req">*</span></label>
                  <PwdInput
                    value={pwd.current}
                    onChange={(v) => setPwd(p => ({ ...p, current: v }))}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                </div>
                <div className="field">
                  <label>New password <span className="req">*</span></label>
                  <PwdInput
                    value={pwd.next}
                    onChange={(v) => setPwd(p => ({ ...p, next: v }))}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                  {pwd.next && (
                    <>
                      <div className="pwd-strength">
                        <i className={ps.score >= 1 ? `on-${ps.cls}` : ''} />
                        <i className={ps.score >= 2 ? `on-${ps.cls}` : ''} />
                        <i className={ps.score >= 3 ? `on-${ps.cls}` : ''} />
                        <i className={ps.score >= 4 ? `on-${ps.cls}` : ''} />
                        <i className={ps.score >= 5 ? `on-${ps.cls}` : ''} />
                      </div>
                      <div className="pwd-hint">
                        Strength: <span className={ps.cls}>{ps.label}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="field">
                  <label>Confirm new password <span className="req">*</span></label>
                  <PwdInput
                    value={pwd.confirm}
                    onChange={(v) => setPwd(p => ({ ...p, confirm: v }))}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                  />
                  {pwd.confirm && pwd.next !== pwd.confirm && (
                    <span className="pwd-hint weak" style={{ color: 'var(--danger)' }}>
                      Passwords don't match.
                    </span>
                  )}
                  {pwd.confirm && pwd.next === pwd.confirm && pwd.next.length >= 8 && (
                    <span className="pwd-hint" style={{ color: 'var(--ok)' }}>
                      <I name="check" size={11} /> Match.
                    </span>
                  )}
                </div>
              </div>
              <div className="sec-foot">
                <span className={`saved ${savedSection === 'password' ? 'is-on' : ''}`}>
                  <I name="check" /> Password changed.
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setPwd({ current: '', next: '', confirm: '' })}
                  >Clear</button>
                  <button
                    className="btn btn-primary"
                    onClick={savePassword}
                    disabled={!pwdValid}
                    style={!pwdValid ? { opacity: 0.5 } : {}}
                  >
                    <I name="shield" /> Change password
                  </button>
                </div>
              </div>
            </section>

            {/* DANGER ──────────────────────────────── */}
            <section className="acct-section is-danger">
              <div className="sec-head">
                <div>
                  <h3>Danger zone</h3>
                  <div className="sub">Sign out of every session or delete your admin account.</div>
                </div>
              </div>
              <div className="acct-row-action">
                <div className="tx">
                  <strong>Sign out of all devices</strong>
                  <span>Revokes every active session except the one you're using now.</span>
                </div>
                <button className="btn" onClick={() => showToast('Other sessions signed out.')}>
                  Sign out everywhere
                </button>
              </div>
              <div className="acct-row-action">
                <div className="tx">
                  <strong>Delete account</strong>
                  <span>Permanently removes your admin user. Other admins keep access.</span>
                </div>
                <button
                  className="btn btn-danger"
                  onClick={() => showToast('Deletion requires a confirmation email — not implemented in this prototype.')}
                >
                  <I name="trash" /> Delete account
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {toast && (
        <div className="toast is-on">
          <span>{toast}</span>
        </div>
      )}
    </>
  );
}

Object.assign(window, { AccountPage });
