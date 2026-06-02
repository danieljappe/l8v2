import { useState, useMemo, useEffect } from 'react';
import type { Message } from '../../types/admin';

interface MessagesListProps {
  messages: Message[];
  loading?: boolean;
  error?: string | null;
  onMarkAsRead: (id: string) => void;
  onDeleteMessage: (id: string) => void;
}

type ViewMode = 'inbox' | 'cards' | 'table';

function colorFromName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = Math.trunc(h * 31 + name.charCodeAt(i));
  const hue = ((h % 360) + 360) % 360;
  return `oklch(0.52 0.14 ${hue})`;
}

function fmtDate(d: string): string {
  try {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch { return d; }
}

function StatusPill({ status }: { status?: string }) {
  const s = status || 'pending';
  const cls = {
    pending: 'a-pill-pending', read: 'a-pill-read',
    replied: 'a-pill-replied', archived: 'a-pill-archived',
  }[s] ?? 'a-pill-pending';
  return <span className={`a-pill ${cls}`}>{s}</span>;
}

export default function MessagesList({ messages, loading, error, onMarkAsRead, onDeleteMessage }: MessagesListProps) {
  const [view, setView] = useState<ViewMode>('inbox');
  const [q, setQ] = useState('');
  const [readFilter, setReadFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<Message | null>(null);

  useEffect(() => {
    // Auto-select first unread message
    const first = messages.find(m => !m.read) ?? messages[0];
    if (first) setSelectedId(first.id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setConfirmDel(null); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const filtered = useMemo(() => {
    let list = messages;
    if (q.trim()) {
      const lq = q.toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(lq) ||
        m.email.toLowerCase().includes(lq) ||
        (m.subject || '').toLowerCase().includes(lq) ||
        m.message.toLowerCase().includes(lq)
      );
    }
    if (readFilter === 'unread') list = list.filter(m => !m.read);
    if (readFilter === 'read') list = list.filter(m => m.read);
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [messages, q, readFilter]);

  const counts = useMemo(() => ({
    all: messages.length,
    unread: messages.filter(m => !m.read).length,
    read: messages.filter(m => m.read).length,
  }), [messages]);

  const selected = useMemo(() => messages.find(m => m.id === selectedId) ?? null, [messages, selectedId]);

  function handleSelect(id: string) {
    setSelectedId(id);
    const m = messages.find(x => x.id === id);
    if (m && !m.read) onMarkAsRead(id);
  }

  function handleDelete(m: Message) { setConfirmDel(m); }

  const IcTrash = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>;
  const IcCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>;
  const IcMsg = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.4 8.4 0 0 1-4-1L3 21l2-5.5a8.4 8.4 0 0 1-1-4A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z"/></svg>;

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-3)' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>Loading messages…</div>
    </div>
  );
  if (error) return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--danger)' }}>Failed to load messages: {error}</div>
  );

  return (
    <div>
      <div className="a-topbar">
        <div className="a-topbar-head">
          <div>
            <h2>Messages</h2>
            <div className="a-topbar-sub">
              {counts.unread > 0
                ? <><strong style={{ color: 'var(--accent)' }}>{counts.unread} unread</strong> · {counts.all} total</>
                : <>{counts.all} total · {counts.read} read</>
              }
            </div>
          </div>
          <div className="a-topbar-actions">
            <button className="a-btn" disabled={counts.unread === 0} style={counts.unread === 0 ? { opacity: 0.45 } : {}}
              onClick={() => { filtered.filter(m => !m.read).forEach(m => onMarkAsRead(m.id)); }}>
              <IcCheck /> Mark all read
            </button>
          </div>
        </div>

        <div className="a-toolbar">
          <div className="a-search">
            <svg className="a-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><circle cx={11} cy={11} r={7}/><path d="m20 20-3.5-3.5"/></svg>
            <input placeholder="Search name, email, subject, body…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {([
              { id: 'all', label: 'All', count: counts.all },
              { id: 'unread', label: 'Unread', count: counts.unread },
              { id: 'read', label: 'Read', count: counts.read },
            ]).map(s => (
              <button key={s.id} className={`a-chip${readFilter === s.id ? ' is-on' : ''}`} onClick={() => setReadFilter(s.id)}>
                {s.label} <span className="ct">{s.count}</span>
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>View</span>
            <div className="a-viewswitch">
              {([
                { id: 'inbox' as const, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.4 8.4 0 0 1-4-1L3 21l2-5.5a8.4 8.4 0 0 1-1-4A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z"/></svg> },
                { id: 'cards' as const, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg> },
                { id: 'table' as const, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={18} height={18} rx={2}/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg> },
              ]).map(v => (
                <button key={v.id} className={view === v.id ? 'is-on' : ''} onClick={() => setView(v.id)}>{v.icon}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="a-body">
        {/* INBOX */}
        {view === 'inbox' && (
          <div className="a-inbox">
            <div className="a-inbox-list">
              {filtered.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>No messages</div>
              )}
              {filtered.map(m => (
                <div
                  key={m.id}
                  className={`a-inbox-row${!m.read ? ' is-unread' : ''}${selectedId === m.id ? ' is-selected' : ''}`}
                  onClick={() => handleSelect(m.id)}
                >
                  <div className="top-line">
                    {!m.read && <span className="unread-dot" />}
                    <span className="from">{m.name}</span>
                    <span className="time">{fmtDate(m.createdAt)}</span>
                  </div>
                  <div className="subj">{m.subject || '(no subject)'}</div>
                  <div className="preview">{m.message}</div>
                  {(m.status || m.artistType) && (
                    <div className="row-tags">
                      {m.status && <StatusPill status={m.status} />}
                      {m.artistType && <span className="a-type-pill">{m.artistType}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="a-inbox-detail">
              {!selected ? (
                <div className="a-inbox-detail-empty">
                  <div className="em-icon"><IcMsg /></div>
                  <h3>No message selected</h3>
                  <p>Select a message from the list to read it.</p>
                </div>
              ) : (
                <>
                  <div className="a-msg-head">
                    <div className="row1">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="crumb" style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>Message</div>
                        <h3>{selected.subject || '(no subject)'}</h3>
                      </div>
                      <div className="head-actions">
                        {selected.read ? null : (
                          <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => onMarkAsRead(selected.id)}>
                            <IcCheck /> Mark read
                          </button>
                        )}
                        <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm a-btn-danger" onClick={() => handleDelete(selected)}>
                          <IcTrash />
                        </button>
                      </div>
                    </div>
                    <div className="a-from-block">
                      <div className="a-from-avatar" style={{ background: colorFromName(selected.name) }}>
                        {selected.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="a-from-info">
                        <div className="nm">{selected.name}</div>
                        <div className="em">
                          <span>{selected.email}</span>
                          {selected.phone && <span>{selected.phone}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="a-msg-body">{selected.message}</div>
                  <div className="a-msg-meta">
                    <div className="mb">
                      <label>Received</label>
                      <div className="v mono">{new Date(selected.createdAt).toLocaleString('en-GB')}</div>
                    </div>
                    {selected.artistType && (
                      <div className="mb">
                        <label>Inquiry type</label>
                        <div className="v">{selected.artistType}</div>
                      </div>
                    )}
                  </div>
                  <div className="a-msg-statusbar">
                    <StatusPill status={selected.status} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                        {selected.read ? 'Read' : 'Unread'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* CARDS */}
        {view === 'cards' && (
          <div className="a-msg-cards">
            {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>No messages</div>}
            {filtered.map(m => (
              <div key={m.id} className={`a-msg-card${!m.read ? ' is-unread' : ''}`} onClick={() => { setView('inbox'); handleSelect(m.id); }}>
                <div className="a-msg-card-head">
                  <div>
                    <div className="a-msg-card-name">{m.name}</div>
                    <div className="a-msg-card-from">{m.email}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{fmtDate(m.createdAt)}</span>
                    <StatusPill status={m.status} />
                  </div>
                </div>
                {m.subject && <div className="a-msg-card-subj">{m.subject}</div>}
                <div className="a-msg-card-body">{m.message}</div>
                <div className="a-msg-card-foot">
                  <span>{m.read ? 'Read' : 'Unread'}</span>
                  <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                    {!m.read && (
                      <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => onMarkAsRead(m.id)}>
                        <IcCheck /> Read
                      </button>
                    )}
                    <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm a-btn-danger" onClick={() => handleDelete(m)}>
                      <IcTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TABLE */}
        {view === 'table' && (
          <div className="a-tbl-wrap">
            <table className="a-tbl">
              <thead>
                <tr>
                  <th>From</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Received</th>
                  <th className="a-actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} style={{ cursor: 'pointer', fontWeight: m.read ? 400 : 600 }} onClick={() => { setView('inbox'); handleSelect(m.id); }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {!m.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
                        <div>
                          <div className="ev-title" style={{ fontSize: 14 }}>{m.name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--ink-2)' }}>{m.subject || '(no subject)'}</td>
                    <td><StatusPill status={m.status} /></td>
                    <td style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{fmtDate(m.createdAt)}</td>
                    <td className="a-actions" onClick={e => e.stopPropagation()}>
                      {!m.read && (
                        <button className="a-btn a-btn-ghost a-btn-icon" title="Mark read" onClick={() => onMarkAsRead(m.id)}><IcCheck /></button>
                      )}
                      <button className="a-btn a-btn-ghost a-btn-icon a-btn-danger" onClick={() => handleDelete(m)}><IcTrash /></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-3)' }}>No messages</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                    <h3>Delete message?</h3>
                  </div>
                </div>
              </div>
              <div className="a-form-body">
                <p style={{ margin: 0, color: 'var(--ink-2)' }}>
                  Delete the message from <strong style={{ color: 'var(--ink)' }}>{confirmDel.name}</strong>.
                </p>
              </div>
              <div className="a-form-foot">
                <span />
                <div className="a-form-foot-r">
                  <button className="a-btn a-btn-ghost" onClick={() => setConfirmDel(null)}>Cancel</button>
                  <button className="a-btn" style={{ background: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' }}
                    onClick={() => { onDeleteMessage(confirmDel.id); if (selectedId === confirmDel.id) setSelectedId(null); setConfirmDel(null); }}>
                    Delete
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
