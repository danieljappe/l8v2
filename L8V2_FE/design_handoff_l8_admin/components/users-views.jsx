// Users (team) — list views.
const { I, monogram, colorFromName } = window;

function fullName(u) {
  return [u.firstName, u.lastName].filter(Boolean).join(' ');
}

function UserAvatar({ user, size = 48 }) {
  const bg = colorFromName(fullName(user));
  if (user.imageUrl) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        overflow: 'hidden', flexShrink: 0,
        background: bg,
      }}>
        <img src={user.imageUrl} alt={fullName(user)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: 'white',
      display: 'grid', placeItems: 'center',
      fontFamily: 'var(--font-display)',
      fontSize: size * 0.38,
      letterSpacing: '-0.02em', lineHeight: 1, flexShrink: 0,
    }}>{monogram(fullName(user))}</div>
  );
}

function YouBadge() {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 9.5,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      padding: '2px 6px', borderRadius: 3,
      background: 'var(--accent-soft)', color: 'var(--accent)',
      marginLeft: 6,
    }}>You</span>
  );
}

function UserActions({ user, currentUserId, onEdit, onDelete, onResetPwd }) {
  const isSelf = user.id === currentUserId;
  return (
    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
      <button
        className="btn btn-ghost btn-icon"
        title="Send password reset"
        onClick={() => onResetPwd(user)}
      >
        <I name="shield" />
      </button>
      <button
        className="btn btn-ghost btn-icon"
        title={isSelf ? 'Edit in Account' : 'Edit'}
        onClick={() => onEdit(user)}
      >
        <I name="edit" />
      </button>
      <button
        className="btn btn-ghost btn-icon btn-danger"
        title={isSelf ? "You can't remove yourself" : 'Remove'}
        disabled={isSelf}
        style={isSelf ? { opacity: 0.4 } : {}}
        onClick={() => !isSelf && onDelete(user)}
      >
        <I name="trash" />
      </button>
    </div>
  );
}

// ── GRID ───────────────────────────────────────────────────
function UsersGridView({ users, currentUserId, onEdit, onDelete, onResetPwd }) {
  if (users.length === 0) {
    return <div className="empty"><h3 className="ttl">No users match.</h3></div>;
  }
  return (
    <div className="users-grid">
      {users.map(u => {
        const isSelf = u.id === currentUserId;
        return (
          <article className="user-card" key={u.id} onClick={() => onEdit(u)}>
            <div className="user-card-top">
              <UserAvatar user={u} size={56} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3 className="user-name">
                  {fullName(u)}
                  {isSelf && <YouBadge />}
                </h3>
                <span className="role-pill role-pill-sm">{u.role}</span>
              </div>
            </div>
            <div className="user-card-info">
              <div className="info-line">
                <I name="message" /> <span>{u.email}</span>
              </div>
              <div className="info-line">
                <I name="user" /> <span>{u.phoneNumber || <span style={{ color: 'var(--ink-3)' }}>No phone</span>}</span>
              </div>
            </div>
            <div className="user-card-foot">
              <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                Joined {window.fmtDate(u.createdAt)}
              </span>
              <UserActions user={u} currentUserId={currentUserId} onEdit={onEdit} onDelete={onDelete} onResetPwd={onResetPwd} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

// ── TABLE ──────────────────────────────────────────────────
function UsersTableView({ users, currentUserId, sort, onSort, onEdit, onDelete, onResetPwd }) {
  const cols = [
    { id: 'name',    label: 'Name' },
    { id: 'role',    label: 'Role' },
    { id: 'email',   label: 'Email' },
    { id: 'phone',   label: 'Phone' },
    { id: 'created', label: 'Member since' },
    { id: 'actions', label: '', sortable: false },
  ];
  const SortIcon = ({ id }) => {
    if (sort.col !== id) return <span className="sort"><I name="chevron-down" size={11} /></span>;
    return <span className="sort"><I name={sort.dir === 'asc' ? 'sort-asc' : 'sort-desc'} size={12} /></span>;
  };
  return (
    <div className="tbl-wrap art-table">
      <table className="tbl">
        <thead>
          <tr>
            {cols.map(c => (
              <th
                key={c.id}
                className={sort.col === c.id ? 'is-sorted' : ''}
                onClick={() => c.sortable !== false && onSort(c.id)}
                style={c.id === 'actions' ? { textAlign: 'right' } : {}}
              >
                {c.label}
                {c.sortable !== false && c.label && <SortIcon id={c.id} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map(u => {
            const isSelf = u.id === currentUserId;
            return (
              <tr key={u.id} onClick={() => onEdit(u)}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <UserAvatar user={u} size={32} />
                    <div style={{ minWidth: 0 }}>
                      <h4 className="ev-title">
                        {fullName(u)}
                        {isSelf && <YouBadge />}
                      </h4>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                        {u.uuid}
                      </div>
                    </div>
                  </div>
                </td>
                <td><span className="role-pill role-pill-sm">{u.role}</span></td>
                <td><span style={{ fontSize: 13 }}>{u.email}</span></td>
                <td>
                  {u.phoneNumber
                    ? <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>{u.phoneNumber}</span>
                    : <span style={{ color: 'var(--ink-3)' }}>—</span>}
                </td>
                <td>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>
                    {window.fmtDate(u.createdAt)}
                  </span>
                </td>
                <td className="actions">
                  <UserActions user={u} currentUserId={currentUserId} onEdit={onEdit} onDelete={onDelete} onResetPwd={onResetPwd} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

Object.assign(window, { UsersGridView, UsersTableView, UserAvatar, fullName: window.fullName || fullName });
