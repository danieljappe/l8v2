import React, { useState, useEffect, useMemo } from 'react';
import type { User } from '../../services/api';
import { apiService } from '../../services/api';
import type { AuthUser } from '../../hooks/useAuth';

interface UsersListProps {
  currentUser?: AuthUser | null;
}

type ViewMode = 'grid' | 'table';

function colorFromName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const hue = ((h % 360) + 360) % 360;
  return `oklch(0.55 0.14 ${hue})`;
}

function monogram(u: User): string {
  const parts = [u.firstName, u.lastName].filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  if (parts.length === 1) return parts[0]![0].toUpperCase();
  if (u.name) return u.name[0].toUpperCase();
  return u.email[0].toUpperCase();
}

function displayName(u: User): string {
  const parts = [u.firstName, u.lastName].filter(Boolean).join(' ');
  return parts || u.name || u.email;
}

function fmtDate(d: string): string {
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

export default function UsersList({ currentUser }: UsersListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewMode>('grid');
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editing, setEditing] = useState<User | null | 'new'>(null);
  const [confirmDel, setConfirmDel] = useState<User | null>(null);

  useEffect(() => {
    setLoading(true);
    apiService.getUsers().then(r => { if (r.data) setUsers(r.data); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setEditing(null); setConfirmDel(null); } }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const roles = useMemo(() => {
    const s = new Set<string>();
    users.forEach(u => u.role && s.add(u.role));
    return [...s].sort();
  }, [users]);

  const filtered = useMemo(() => {
    let list = users;
    if (q.trim()) {
      const lq = q.toLowerCase();
      list = list.filter(u =>
        (u.firstName || '').toLowerCase().includes(lq) ||
        (u.lastName || '').toLowerCase().includes(lq) ||
        u.email.toLowerCase().includes(lq) ||
        (u.phoneNumber || '').toLowerCase().includes(lq)
      );
    }
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    return [...list].sort((a, b) => displayName(a).localeCompare(displayName(b)));
  }, [users, q, roleFilter]);

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: users.length };
    roles.forEach(r => { out[r] = users.filter(u => u.role === r).length; });
    return out;
  }, [users, roles]);

  async function handleSave(data: Partial<User> & { password?: string }) {
    if (editing === 'new') {
      if (!data.firstName || !data.lastName || !data.email || !data.password) return;
      const res = await apiService.createUser({ firstName: data.firstName, lastName: data.lastName, email: data.email, password: data.password });
      if (res.data) setUsers(prev => [...prev, res.data!]);
    } else if (editing) {
      const { password: _pw, ...rest } = data;
      const res = await apiService.updateUser(editing.id, rest);
      if (res.data) setUsers(prev => prev.map(u => u.id === editing.id ? res.data! : u));
    }
    setEditing(null);
  }

  async function handleDelete(u: User) {
    if (u.id === currentUser?.id) return;
    const res = await apiService.deleteUser(u.id);
    if (!res.error) {
      setUsers(prev => prev.filter(x => x.id !== u.id));
      setConfirmDel(null);
    }
  }

  const IcEdit = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.12 2.12 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>;
  const IcTrash = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>;

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-3)' }}>Loading users…</div>;

  return (
    <div>
      <div className="a-topbar">
        <div className="a-topbar-head">
          <div>
            <h2>Users</h2>
            <div className="a-topbar-sub">
              {counts.all} team member{counts.all !== 1 ? 's' : ''}
              {roles.map(r => ` · ${counts[r] || 0} ${r}`).join('')}
            </div>
          </div>
          <div className="a-topbar-actions">
            <button className="a-btn a-btn-primary" onClick={() => setEditing('new')}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Invite user
            </button>
          </div>
        </div>

        <div className="a-toolbar">
          <div className="a-search">
            <svg className="a-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><circle cx={11} cy={11} r={7}/><path d="m20 20-3.5-3.5"/></svg>
            <input placeholder="Search name, email, phone…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <button className={`a-chip${roleFilter === 'all' ? ' is-on' : ''}`} onClick={() => setRoleFilter('all')}>
            All <span className="ct">{counts.all}</span>
          </button>
          {roles.map(r => (
            <button key={r} className={`a-chip${roleFilter === r ? ' is-on' : ''}`} onClick={() => setRoleFilter(r)}>
              {r[0].toUpperCase() + r.slice(1)} <span className="ct">{counts[r] || 0}</span>
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>View</span>
            <div className="a-viewswitch">
              {([
                { id: 'grid' as const, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={7} height={7} rx={1}/><rect x={14} y={3} width={7} height={7} rx={1}/><rect x={3} y={14} width={7} height={7} rx={1}/><rect x={14} y={14} width={7} height={7} rx={1}/></svg> },
                { id: 'table' as const, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={18} height={18} rx={2}/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg> },
              ]).map(v => (
                <button key={v.id} className={view === v.id ? 'is-on' : ''} onClick={() => setView(v.id)}>{v.icon}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="a-body">
        {filtered.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-3)' }}>No users found</div>
        )}

        {/* GRID */}
        {view === 'grid' && filtered.length > 0 && (
          <div className="a-user-grid">
            {filtered.map(u => {
              const bg = colorFromName(displayName(u));
              const mono = monogram(u);
              const isYou = u.id === currentUser?.id;
              return (
                <div key={u.id} className="a-user-card">
                  <div className="a-user-avatar-row">
                    <div className="a-user-avatar" style={{ background: bg }}>
                      {u.imageUrl ? <img src={u.imageUrl} alt={displayName(u)} /> : mono}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 className="a-user-name">{displayName(u)}</h3>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
                        <span className={`a-pill a-pill-${u.role || 'viewer'}`}>{u.role || 'viewer'}</span>
                        {isYou && <span className="a-you-badge">You</span>}
                      </div>
                    </div>
                  </div>
                  <div className="a-user-info">
                    <div className="line">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="m22 6-10 7L2 6"/></svg>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                    </div>
                    {u.phoneNumber && (
                      <div className="line">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.58 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        {u.phoneNumber}
                      </div>
                    )}
                    {u.address && (
                      <div className="line">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-7-7.5-7-13a7 7 0 1 1 14 0c0 5.5-7 13-7 13Z"/><circle cx={12} cy={9} r={2.5}/></svg>
                        {u.address}
                      </div>
                    )}
                  </div>
                  <div className="a-user-foot">
                    <span>Since {fmtDate(u.createdAt)}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm" onClick={() => setEditing(u)}><IcEdit /></button>
                      {!isYou && (
                        <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm a-btn-danger" onClick={() => setConfirmDel(u)}><IcTrash /></button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TABLE */}
        {view === 'table' && filtered.length > 0 && (
          <div className="a-tbl-wrap">
            <table className="a-tbl">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 70 }}>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th className="a-actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const bg = colorFromName(displayName(u));
                  const mono = monogram(u);
                  const isYou = u.id === currentUser?.id;
                  return (
                    <tr key={u.id}>
                      <td style={{ paddingLeft: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16 }}>
                          <div className="a-user-avatar" style={{ width: 32, height: 32, fontSize: 14, background: bg, flexShrink: 0 }}>
                            {u.imageUrl ? <img src={u.imageUrl} alt="" /> : mono}
                          </div>
                          <div>
                            <div className="ev-title" style={{ fontSize: 14 }}>{displayName(u)}</div>
                            {isYou && <span className="a-you-badge">You</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)' }}>{u.email}</td>
                      <td><span className={`a-pill a-pill-${u.role || 'viewer'}`}>{u.role || 'viewer'}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>{fmtDate(u.createdAt)}</td>
                      <td className="a-actions">
                        <button className="a-btn a-btn-ghost a-btn-icon" onClick={() => setEditing(u)}><IcEdit /></button>
                        {!isYou && (
                          <button className="a-btn a-btn-ghost a-btn-icon a-btn-danger" onClick={() => setConfirmDel(u)}><IcTrash /></button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User drawer form */}
      {editing !== null && (
        <>
          <div className="a-scrim" onClick={() => setEditing(null)} />
          <div className="a-drawer-shell">
            <div className="a-drawer-card">
              <UserDrawerForm
                user={editing === 'new' ? null : editing}
                onSave={handleSave}
                onClose={() => setEditing(null)}
                onDelete={editing !== 'new' && editing && editing.id !== currentUser?.id ? () => setConfirmDel(editing as User) : undefined}
              />
            </div>
          </div>
        </>
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <>
          <div className="a-scrim" onClick={() => setConfirmDel(null)} />
          <div className="a-modal-shell">
            <div className="a-modal-card" style={{ maxWidth: 460 }}>
              <div className="a-form-head">
                <div className="a-form-head-l">
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>Confirm</div>
                    <h3>Remove user?</h3>
                  </div>
                </div>
              </div>
              <div className="a-form-body">
                <p style={{ margin: 0, color: 'var(--ink-2)' }}>
                  Remove <strong style={{ color: 'var(--ink)' }}>{displayName(confirmDel)}</strong> from the team.
                  They'll lose access immediately.
                </p>
              </div>
              <div className="a-form-foot">
                <span />
                <div className="a-form-foot-r">
                  <button className="a-btn a-btn-ghost" onClick={() => setConfirmDel(null)}>Cancel</button>
                  <button className="a-btn" style={{ background: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' }}
                    onClick={() => handleDelete(confirmDel)}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function UserDrawerForm({ user, onSave, onClose, onDelete }: {
  user: User | null;
  onSave: (data: Partial<User> & { password?: string }) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phoneNumber: '', address: '', role: 'viewer', imageUrl: '', password: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        role: user.role || 'viewer',
        imageUrl: user.imageUrl || '',
        password: '',
      });
    } else {
      setForm({ firstName: '', lastName: '', email: '', phoneNumber: '', address: '', role: 'viewer', imageUrl: '', password: '' });
    }
  }, [user]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { password, ...rest } = form;
    onSave({ ...rest, ...(password ? { password } : {}) });
  }

  function set(key: keyof typeof form, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="a-form-head">
        <div className="a-form-head-l">
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>
              {user ? 'Team member' : 'Invite'}
            </div>
            <h3>{user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email : 'New user'}</h3>
          </div>
        </div>
        <div className="a-form-head-r">
          <button type="button" className="a-btn a-btn-ghost a-btn-icon" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <div className="a-form-body">
        <div className="a-form-grid">
          <div className="a-field">
            <label>First name</label>
            <input className="a-input" value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Jane" />
          </div>
          <div className="a-field">
            <label>Last name</label>
            <input className="a-input" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Doe" />
          </div>
          <div className="a-field full">
            <label>Email <span className="req">*</span></label>
            <input className="a-input" required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" />
          </div>
          <div className="a-field">
            <label>Phone</label>
            <input className="a-input" type="tel" value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} placeholder="+45 …" />
          </div>
          <div className="a-field">
            <label>Role</label>
            <select className="a-select" value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="a-field full">
            <label>Address</label>
            <input className="a-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street, city" />
          </div>
          <div className="a-field full">
            <label>Image URL</label>
            <input className="a-input" value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="https://…" />
          </div>
          {!user && (
            <div className="a-field full">
              <label>Password <span className="req">*</span></label>
              <input className="a-input" required type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Temporary password" />
            </div>
          )}
        </div>
      </div>

      <div className="a-form-foot">
        <div>
          {onDelete && (
            <button type="button" className="a-btn a-btn-ghost a-btn-danger" onClick={() => { onDelete(); onClose(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              Remove user
            </button>
          )}
        </div>
        <div className="a-form-foot-r">
          <button type="button" className="a-btn a-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="a-btn a-btn-primary">{user ? 'Save changes' : 'Create user'}</button>
        </div>
      </div>
    </form>
  );
}
