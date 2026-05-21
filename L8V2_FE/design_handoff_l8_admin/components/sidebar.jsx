// Sidebar
function Sidebar({ active, onNavigate, badges = {}, user }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'events',    label: 'Events',    icon: 'calendar' },
    { id: 'artists',   label: 'Artists',   icon: 'users' },
    { id: 'venues',    label: 'Venues',    icon: 'pin' },
    { id: 'gallery',   label: 'Gallery',   icon: 'image' },
    { id: 'messages',  label: 'Messages',  icon: 'message', badge: badges.messages },
    { id: 'users',     label: 'Users',     icon: 'users' },
    { id: 'account',   label: 'Account',   icon: 'user' },
  ];
  const u = user || window.CURRENT_USER || { firstName: '', lastName: '', email: '', imageUrl: null };
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Account';
  const initials = window.monogram ? window.monogram(name) : name.slice(0, 2).toUpperCase();
  return (
    <aside className="sb">
      <div className="sb-brand">
        <div className="sb-mark">L8</div>
        <div>
          <h1>L8 Events</h1>
          <small>Admin</small>
        </div>
      </div>
      <nav className="sb-nav">
        {items.map(it => (
          <button
            key={it.id}
            className={`sb-link ${active === it.id ? 'is-active' : ''}`}
            onClick={() => onNavigate?.(it.id)}
          >
            <window.I name={it.icon} />
            <span>{it.label}</span>
            {it.badge ? <span className="sb-badge">{it.badge}</span> : null}
          </button>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: 18 }}>
          <button className="sb-link">
            <window.I name="arrow-left" />
            <span>Back to site</span>
          </button>
          <button className="sb-link" style={{ color: 'var(--danger)' }}>
            <window.I name="logout" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
      <div className="sb-footer">
        <div
          className="sb-avatar"
          style={{
            background: u.imageUrl ? 'transparent' : (window.colorFromName ? window.colorFromName(name) : undefined),
            overflow: 'hidden',
          }}
        >
          {u.imageUrl
            ? <img src={u.imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials}
        </div>
        <div className="sb-who">
          <div className="nm">{name}</div>
          <div className="em">{u.email}</div>
        </div>
      </div>
    </aside>
  );
}
Object.assign(window, { Sidebar });
