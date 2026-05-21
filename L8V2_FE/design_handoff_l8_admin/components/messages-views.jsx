// Messages — inbox (2-pane), cards, table.
const { I, monogram, colorFromName } = window;

function MsgStatusPill({ status }) {
  return <span className={`msg-pill msg-pill-${status}`}>{status}</span>;
}

// ── INBOX (2-pane, default) ────────────────────────────────
function MessagesInboxView({ messages, selectedId, onSelect, onPatch, onDelete }) {
  const selected = messages.find(m => m.id === selectedId) || null;
  return (
    <div className="inbox">
      <div className="inbox-list">
        {messages.length === 0 && (
          <div className="empty" style={{ padding: 40 }}>
            <h3 className="ttl">Inbox empty.</h3>
            <p>No messages match the current filter.</p>
          </div>
        )}
        {messages.map(m => {
          const preview = m.message.replace(/\s+/g, ' ').slice(0, 90);
          return (
            <div
              key={m.id}
              className={`inbox-row ${selectedId === m.id ? 'is-selected' : ''} ${!m.isRead ? 'is-unread' : ''}`}
              onClick={() => onSelect(m.id)}
            >
              <div className="top-line">
                {!m.isRead && <span className="unread-dot" />}
                <span className="from">{m.name}</span>
                <span className="time">{window.fmtRelative(m.createdAt)}</span>
              </div>
              <div className="subj">
                {m.subject || <span style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>(no subject)</span>}
              </div>
              <div className="preview">{preview}{m.message.length > 90 ? '…' : ''}</div>
              <div className="row-tags">
                <MsgStatusPill status={m.status} />
                {m.artistType && <span className="type-pill">{m.artistType.split(' ')[0]}</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="inbox-detail">
        {selected
          ? <MessageDetail message={selected} onPatch={onPatch} onDelete={onDelete} />
          : (
            <div className="inbox-detail-empty">
              <div>
                <div className="em-icon"><I name="message" size={28} /></div>
                <h3>Select a message</h3>
                <p>Pick one from the inbox to see the full thread, sender info, and actions.</p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

function MessageDetail({ message, onPatch, onDelete }) {
  const m = message;
  return (
    <>
      <div className="msg-head">
        <div className="row1">
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="crumb">Message · {m.uuid}</div>
            <h3>{m.subject || <span style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>(no subject)</span>}</h3>
          </div>
          <div className="head-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onPatch(m, { isRead: !m.isRead })}
              title={m.isRead ? 'Mark as unread' : 'Mark as read'}
            >
              <I name="eye" /> {m.isRead ? 'Mark unread' : 'Mark read'}
            </button>
            <button
              className="btn btn-ghost btn-icon btn-danger"
              onClick={() => onDelete(m)}
              title="Delete"
            >
              <I name="trash" />
            </button>
          </div>
        </div>
        <div className="from-block">
          <div className="from-avatar" style={{ background: colorFromName(m.name) }}>
            {monogram(m.name)}
          </div>
          <div className="from-info">
            <div className="nm">{m.name}</div>
            <div className="em">
              <span><I name="message" /> {m.email}</span>
              {m.phone && <span><I name="user" /> {m.phone}</span>}
              <span>{window.fmtMessageDate(m.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="msg-body">{m.message}</div>

      <div className="msg-meta">
        <div className="mb">
          <label>Artist type</label>
          <div className="v">{m.artistType || <span style={{ color: 'var(--ink-3)' }}>—</span>}</div>
        </div>
        <div className="mb">
          <label>Subject</label>
          <div className="v">{m.subject || <span style={{ color: 'var(--ink-3)' }}>—</span>}</div>
        </div>
        <div className="mb">
          <label>Phone</label>
          <div className="v mono">{m.phone || <span style={{ color: 'var(--ink-3)', fontFamily: 'inherit' }}>Not provided</span>}</div>
        </div>
        <div className="mb">
          <label>Email</label>
          <div className="v mono">{m.email}</div>
        </div>
        <div className="mb">
          <label>Received</label>
          <div className="v mono">{window.fmtMessageDate(m.createdAt)}</div>
        </div>
        <div className="mb">
          <label>Last updated</label>
          <div className="v mono">{window.fmtMessageDate(m.updatedAt)}</div>
        </div>
      </div>

      <div className="msg-status-bar">
        <span className="lbl">Status</span>
        <div className="seg">
          {window.MESSAGE_STATUSES.map(s => (
            <button
              key={s}
              className={m.status === s ? 'is-on' : ''}
              onClick={() => onPatch(m, { status: s })}
            >
              <span className={`status-dot ${s}`} />
              {s}
            </button>
          ))}
        </div>
        <a
          href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || 'Your message to L8')}`}
          className="btn btn-primary reply-btn"
          onClick={() => onPatch(m, { status: 'replied', isRead: true })}
        >
          <I name="arrow-right" /> Reply via email
        </a>
      </div>
    </>
  );
}

// ── CARDS ──────────────────────────────────────────────────
function MessagesCardsView({ messages, onSelect, onPatch, onDelete }) {
  if (messages.length === 0) {
    return <div className="empty"><h3 className="ttl">Inbox empty.</h3><p>No messages match the current filter.</p></div>;
  }
  return (
    <div className="msg-cards">
      {messages.map(m => (
        <article key={m.id} className={`msg-card ${!m.isRead ? 'is-unread' : ''}`}>
          <div className="top">
            <div className="nm-block">
              <h3 className="nm">{m.name}</h3>
              <div className="em">
                <span><I name="message" /> {m.email}</span>
                {m.phone && <span><I name="user" /> {m.phone}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {m.artistType && <span className="type-pill">{m.artistType.split(' ')[0]}</span>}
              <MsgStatusPill status={m.status} />
            </div>
          </div>
          <h4 className={`subj ${!m.subject ? 'is-empty' : ''}`}>
            {m.subject || '(no subject)'}
          </h4>
          <p className="body">{m.message}</p>
          <div className="foot">
            <span>{window.fmtMessageDate(m.createdAt)}</span>
            <div className="actions">
              <button className="btn btn-ghost btn-sm" onClick={() => onPatch(m, { isRead: !m.isRead })}>
                <I name="eye" /> {m.isRead ? 'Mark unread' : 'Mark read'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => onSelect(m.id)}>
                <I name="arrow-right" /> Open
              </button>
              <button className="btn btn-ghost btn-icon btn-danger" onClick={() => onDelete(m)}>
                <I name="trash" />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

// ── TABLE ──────────────────────────────────────────────────
function MessagesTableView({ messages, sort, onSort, onSelect, onPatch, onDelete }) {
  const cols = [
    { id: 'from',    label: 'From' },
    { id: 'subject', label: 'Subject' },
    { id: 'type',    label: 'Type' },
    { id: 'status',  label: 'Status' },
    { id: 'created', label: 'Received' },
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
          {messages.map(m => (
            <tr key={m.id} onClick={() => onSelect(m.id)} style={{ cursor: 'default' }}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {!m.isRead && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: m.isRead ? 400 : 600, fontSize: 13.5 }}>{m.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{m.email}</div>
                  </div>
                </div>
              </td>
              <td>
                <span style={{
                  fontSize: 13.5,
                  fontWeight: m.isRead ? 400 : 500,
                  color: m.subject ? 'var(--ink)' : 'var(--ink-3)',
                  fontStyle: m.subject ? 'normal' : 'italic',
                }}>
                  {m.subject || '(no subject)'}
                </span>
              </td>
              <td>
                {m.artistType
                  ? <span className="type-pill">{m.artistType.split(' ')[0]}</span>
                  : <span style={{ color: 'var(--ink-3)' }}>—</span>}
              </td>
              <td><MsgStatusPill status={m.status} /></td>
              <td>
                <span style={{ fontSize: 12, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>
                  {window.fmtRelative(m.createdAt)} ago
                </span>
              </td>
              <td className="actions" onClick={(e) => e.stopPropagation()}>
                <div className="row-actions">
                  <button
                    className="btn btn-ghost btn-icon"
                    title={m.isRead ? 'Mark unread' : 'Mark read'}
                    onClick={() => onPatch(m, { isRead: !m.isRead })}
                  >
                    <I name="eye" />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-danger" title="Delete" onClick={() => onDelete(m)}>
                    <I name="trash" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {messages.length === 0 && (
        <div className="empty"><h3 className="ttl">Inbox empty.</h3><p>No messages match the current filter.</p></div>
      )}
    </div>
  );
}

Object.assign(window, {
  MessagesInboxView, MessagesCardsView, MessagesTableView, MsgStatusPill,
});
