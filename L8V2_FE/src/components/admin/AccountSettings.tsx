import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { AuthUser } from '../../hooks/useAuth';
import type { User as ApiUser } from '../../services/api';
import { apiService } from '../../services/api';

interface AccountSettingsProps {
  user?: AuthUser | null;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  imageUrl: string;
  role: string;
}

interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const createFormState = (user?: Partial<ApiUser>): FormState => ({
  firstName: user?.firstName || '',
  lastName: user?.lastName || '',
  email: user?.email || '',
  phoneNumber: user?.phoneNumber || '',
  address: user?.address || '',
  imageUrl: user?.imageUrl || '',
  role: user?.role || '',
});

const emptyPasswordState: PasswordFormState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `oklch(0.45 0.13 ${hue})`;
}

function monogram(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function passwordStrength(pwd: string): { score: number; label: string; cls: string } {
  if (!pwd) return { score: 0, label: '', cls: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { score, label: 'weak', cls: 'on-weak' };
  if (score <= 3) return { score, label: 'medium', cls: 'on-med' };
  return { score, label: 'strong', cls: 'on-strong' };
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

function PwdInput({
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="a-pwd-wrap">
      <input
        type={show ? 'text' : 'password'}
        className="a-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="a-pwd-toggle"
        onClick={() => setShow((s) => !s)}
        title={show ? 'Hide' : 'Show'}
      >
        {show ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function AccountSettings({ user }: AccountSettingsProps) {
  const userId = user?.id;
  const [loading, setLoading] = useState(true);
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);

  const [profileForm, setProfileForm] = useState<Pick<FormState, 'firstName' | 'lastName' | 'role' | 'imageUrl'>>({
    firstName: '',
    lastName: '',
    role: '',
    imageUrl: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [contactForm, setContactForm] = useState<Pick<FormState, 'email' | 'phoneNumber' | 'address'>>({
    email: '',
    phoneNumber: '',
    address: '',
  });
  const [contactSaving, setContactSaving] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(emptyPasswordState);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }

  function flashSaved(key: 'profile' | 'contact' | 'password') {
    if (key === 'profile') { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 1800); }
    if (key === 'contact') { setContactSaved(true); setTimeout(() => setContactSaved(false), 1800); }
    if (key === 'password') { setPasswordSaved(true); setTimeout(() => setPasswordSaved(false), 1800); }
  }

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      if (!userId) { setLoading(false); return; }
      setLoading(true);
      const res = await apiService.getUser(userId);
      if (!isMounted) return;
      if (res.data) {
        const u = res.data;
        setApiUser(u);
        setProfileForm({ firstName: u.firstName || '', lastName: u.lastName || '', role: u.role || '', imageUrl: u.imageUrl || '' });
        setContactForm({ email: u.email || '', phoneNumber: u.phoneNumber || '', address: u.address || '' });
      }
      setLoading(false);
    };
    void fetchUser();
    return () => { isMounted = false; };
  }, [userId]);

  const profileDirty = useMemo(() => {
    if (!apiUser) return false;
    return (
      profileForm.firstName !== (apiUser.firstName || '') ||
      profileForm.lastName !== (apiUser.lastName || '') ||
      profileForm.role !== (apiUser.role || '') ||
      profileForm.imageUrl !== (apiUser.imageUrl || '')
    );
  }, [profileForm, apiUser]);

  const contactDirty = useMemo(() => {
    if (!apiUser) return false;
    return (
      contactForm.email !== (apiUser.email || '') ||
      contactForm.phoneNumber !== (apiUser.phoneNumber || '') ||
      contactForm.address !== (apiUser.address || '')
    );
  }, [contactForm, apiUser]);

  const handleSaveProfile = useCallback(async () => {
    if (!userId || !profileDirty) return;
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      showToast('First and last name are required.');
      return;
    }
    setProfileSaving(true);
    const res = await apiService.updateUser(userId, {
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      role: profileForm.role.trim() || undefined,
      imageUrl: profileForm.imageUrl.trim() || undefined,
    });
    setProfileSaving(false);
    if (res.data) {
      setApiUser(res.data);
      setProfileForm({ firstName: res.data.firstName || '', lastName: res.data.lastName || '', role: res.data.role || '', imageUrl: res.data.imageUrl || '' });
      flashSaved('profile');
    } else {
      showToast(res.error || 'Failed to save profile.');
    }
  }, [userId, profileDirty, profileForm]);

  const handleSaveContact = useCallback(async () => {
    if (!userId || !contactDirty) return;
    if (!contactForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) {
      showToast('Enter a valid email.');
      return;
    }
    setContactSaving(true);
    const res = await apiService.updateUser(userId, {
      email: contactForm.email.trim(),
      phoneNumber: contactForm.phoneNumber.trim() || undefined,
    });
    setContactSaving(false);
    if (res.data) {
      setApiUser(res.data);
      setContactForm({ email: res.data.email || '', phoneNumber: res.data.phoneNumber || '', address: contactForm.address });
      flashSaved('contact');
    } else {
      showToast(res.error || 'Failed to save contact.');
    }
  }, [userId, contactDirty, contactForm]);

  const pwStrength = passwordStrength(passwordForm.newPassword);
  const pwdValid =
    passwordForm.currentPassword.length > 0 &&
    passwordForm.newPassword.length >= 8 &&
    passwordForm.newPassword === passwordForm.confirmPassword &&
    passwordForm.newPassword !== passwordForm.currentPassword;

  const handleSavePassword = useCallback(async () => {
    if (!userId) return;
    if (!passwordForm.currentPassword) { showToast('Enter your current password.'); return; }
    if (passwordForm.newPassword.length < 8) { showToast('New password must be at least 8 characters.'); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { showToast("New passwords don't match."); return; }
    if (passwordForm.newPassword === passwordForm.currentPassword) { showToast('New password must differ from current.'); return; }
    setPasswordSaving(true);
    const res = await apiService.changePassword(userId, {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
    setPasswordSaving(false);
    if (res.error) {
      showToast(res.error);
    } else {
      setPasswordForm(emptyPasswordState);
      flashSaved('password');
      showToast('Password updated.');
    }
  }, [userId, passwordForm]);

  const displayName = apiUser ? [apiUser.firstName, apiUser.lastName].filter(Boolean).join(' ') || apiUser.email : '';
  const photoBg = displayName ? colorFromName(displayName) : 'oklch(0.45 0.1 200)';

  if (!userId) {
    return (
      <div className="a-topbar">
        <div className="a-topbar-head">
          <h2>Account</h2>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="a-topbar">
        <div className="a-topbar-head">
          <div>
            <h2>Account</h2>
            <div className="a-sub">Manage your profile, contact information, and password.</div>
          </div>
        </div>
      </div>

      <div className="a-body">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--line)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'a-spin 0.7s linear infinite' }} />
          </div>
        ) : (
          <div className="a-acct-grid">
            {/* Side card */}
            <aside className="a-acct-side">
              <div className="a-acct-photo" style={{ background: photoBg }}>
                {apiUser?.imageUrl ? (
                  <img src={apiUser.imageUrl} alt={displayName} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <span>{displayName ? monogram(displayName) : '?'}</span>
                )}
                <div className="a-acct-photo-overlay">Change photo</div>
              </div>
              <h2 className="a-acct-name">{displayName || 'Unnamed'}</h2>
              <p className="a-acct-email">{apiUser?.email}</p>
              {apiUser?.role && <span className="a-role-pill">{apiUser.role}</span>}
              {apiUser && (
                <div className="a-acct-meta">
                  <div className="ml-row">
                    <span className="k">User ID</span>
                    <span className="v mono">{apiUser.id?.slice(0, 8)}…</span>
                  </div>
                  <div className="ml-row">
                    <span className="k">Member since</span>
                    <span className="v">{fmtDate(apiUser.createdAt)}</span>
                  </div>
                  <div className="ml-row">
                    <span className="k">Last updated</span>
                    <span className="v">{fmtDate(apiUser.updatedAt)}</span>
                  </div>
                </div>
              )}
            </aside>

            {/* Main sections */}
            <div className="a-acct-main">
              {/* Profile */}
              <section className="a-acct-section">
                <div className="sec-head">
                  <div>
                    <h3>Profile</h3>
                    <div className="sub">Name, role, and avatar URL.</div>
                  </div>
                </div>
                <div className="sec-body">
                  <div className="a-field">
                    <label className="a-label">First name <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      className="a-input"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                      placeholder="First name"
                    />
                  </div>
                  <div className="a-field">
                    <label className="a-label">Last name <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      className="a-input"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                      placeholder="Last name"
                    />
                  </div>
                  <div className="a-field">
                    <label className="a-label">Role</label>
                    <input
                      className="a-input"
                      value={profileForm.role}
                      onChange={(e) => setProfileForm((p) => ({ ...p, role: e.target.value }))}
                      placeholder="e.g. CEO & Founder, Creative Director"
                    />
                    <span className="a-hint">Controls what you can see and edit across the admin panel.</span>
                  </div>
                  <div className="a-field">
                    <label className="a-label">Profile photo URL</label>
                    <input
                      className="a-input"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
                      placeholder="https://…"
                      value={profileForm.imageUrl}
                      onChange={(e) => setProfileForm((p) => ({ ...p, imageUrl: e.target.value }))}
                    />
                    <span className="a-hint">Or drag a file to upload (1:1 ratio recommended).</span>
                  </div>
                  <div className="a-field full">
                    <div className="a-dropzone">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 16 12 12 8 16" />
                        <line x1="12" y1="12" x2="12" y2="21" />
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                      </svg>
                      <strong>Upload a new photo</strong>
                      <span>JPG / PNG / WebP up to 4 MB</span>
                    </div>
                  </div>
                </div>
                <div className="sec-foot">
                  <span className={`saved${profileSaved ? ' is-on' : ''}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Saved.
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="a-btn a-btn-ghost"
                      disabled={!profileDirty || profileSaving}
                      onClick={() => {
                        if (apiUser) setProfileForm({ firstName: apiUser.firstName || '', lastName: apiUser.lastName || '', role: apiUser.role || '', imageUrl: apiUser.imageUrl || '' });
                      }}
                    >
                      Revert
                    </button>
                    <button
                      type="button"
                      className="a-btn a-btn-primary"
                      disabled={!profileDirty || profileSaving}
                      onClick={() => void handleSaveProfile()}
                    >
                      {profileSaving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </div>
              </section>

              {/* Contact */}
              <section className="a-acct-section">
                <div className="sec-head">
                  <div>
                    <h3>Contact</h3>
                    <div className="sub">Email, phone, and address. Email is the login.</div>
                  </div>
                </div>
                <div className="sec-body">
                  <div className="a-field full">
                    <label className="a-label">Email <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      type="email"
                      className="a-input"
                      value={contactForm.email}
                      onChange={(e) => setContactForm((c) => ({ ...c, email: e.target.value }))}
                      autoComplete="email"
                    />
                    <span className="a-hint">Changing this will require you to verify the new address on next sign-in.</span>
                  </div>
                  <div className="a-field full">
                    <label className="a-label">Phone number</label>
                    <input
                      type="tel"
                      className="a-input"
                      placeholder="+45 …"
                      value={contactForm.phoneNumber}
                      onChange={(e) => setContactForm((c) => ({ ...c, phoneNumber: e.target.value }))}
                      autoComplete="tel"
                    />
                  </div>
                  <div className="a-field full">
                    <label className="a-label">
                      Address{' '}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--warn)', marginLeft: 4 }}>+ schema note</span>
                    </label>
                    <input
                      className="a-input"
                      placeholder="Street, postal code, city"
                      value={contactForm.address}
                      onChange={(e) => setContactForm((c) => ({ ...c, address: e.target.value }))}
                      autoComplete="street-address"
                    />
                    <span className="a-hint">The users table doesn't have an <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>address</code> column yet — needs a migration to persist.</span>
                  </div>
                </div>
                <div className="sec-foot">
                  <span className={`saved${contactSaved ? ' is-on' : ''}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Saved.
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="a-btn a-btn-ghost"
                      disabled={!contactDirty || contactSaving}
                      onClick={() => {
                        if (apiUser) setContactForm({ email: apiUser.email || '', phoneNumber: apiUser.phoneNumber || '', address: apiUser.address || '' });
                      }}
                    >
                      Revert
                    </button>
                    <button
                      type="button"
                      className="a-btn a-btn-primary"
                      disabled={!contactDirty || contactSaving}
                      onClick={() => void handleSaveContact()}
                    >
                      {contactSaving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </div>
              </section>

              {/* Password */}
              <section className="a-acct-section">
                <div className="sec-head">
                  <div>
                    <h3>Password</h3>
                    <div className="sub">Change your password. Use at least 8 characters.</div>
                  </div>
                </div>
                <div className="sec-body">
                  <div className="a-field full">
                    <label className="a-label">Current password <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <PwdInput
                      value={passwordForm.currentPassword}
                      onChange={(v) => setPasswordForm((p) => ({ ...p, currentPassword: v }))}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="a-field">
                    <label className="a-label">New password <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <PwdInput
                      value={passwordForm.newPassword}
                      onChange={(v) => setPasswordForm((p) => ({ ...p, newPassword: v }))}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                    />
                    {passwordForm.newPassword && (
                      <>
                        <div className="a-pwd-strength">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <span key={i} className={pwStrength.score >= i ? pwStrength.cls : ''} />
                          ))}
                        </div>
                        <div className="a-pwd-hint">
                          Strength: <span style={{ color: pwStrength.cls === 'on-strong' ? 'var(--ok)' : pwStrength.cls === 'on-med' ? 'var(--warn)' : 'var(--danger)' }}>{pwStrength.label}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="a-field">
                    <label className="a-label">Confirm new password <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <PwdInput
                      value={passwordForm.confirmPassword}
                      onChange={(v) => setPasswordForm((p) => ({ ...p, confirmPassword: v }))}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                    />
                    {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                      <div className="a-pwd-hint err">Passwords don't match.</div>
                    )}
                    {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.newPassword.length >= 8 && (
                      <div className="a-pwd-hint ok">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: 3 }}><polyline points="20 6 9 17 4 12" /></svg>
                        Match.
                      </div>
                    )}
                  </div>
                </div>
                <div className="sec-foot">
                  <span className={`saved${passwordSaved ? ' is-on' : ''}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Password changed.
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="a-btn a-btn-ghost"
                      onClick={() => setPasswordForm(emptyPasswordState)}
                      disabled={passwordSaving}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="a-btn a-btn-primary"
                      disabled={!pwdValid || passwordSaving}
                      onClick={() => void handleSavePassword()}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      {passwordSaving ? 'Updating…' : 'Change password'}
                    </button>
                  </div>
                </div>
              </section>

              {/* Danger zone */}
              <section className="a-acct-section is-danger">
                <div className="sec-head">
                  <div>
                    <h3>Danger zone</h3>
                    <div className="sub">Sign out of every session or delete your admin account.</div>
                  </div>
                </div>
                <div className="a-acct-row-action">
                  <div className="tx">
                    <strong>Sign out of all devices</strong>
                    <span>Revokes every active session except the one you're using now.</span>
                  </div>
                  <button
                    type="button"
                    className="a-btn a-btn-ghost"
                    onClick={() => showToast('Other sessions signed out.')}
                  >
                    Sign out everywhere
                  </button>
                </div>
                <div className="a-acct-row-action">
                  <div className="tx">
                    <strong>Delete account</strong>
                    <span>Permanently removes your admin user. Other admins keep access.</span>
                  </div>
                  <button
                    type="button"
                    className="a-btn a-btn-danger"
                    onClick={() => showToast('Deletion requires a confirmation email — not implemented yet.')}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                    Delete account
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>

      <div className={`a-toast${toast ? ' is-on' : ''}`}>
        <span>{toast}</span>
      </div>
    </>
  );
}
