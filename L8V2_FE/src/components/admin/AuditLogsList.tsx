import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';
import type { AuditLogEntry, AuditLogPage } from '../../types/admin';

const TABLES = ['event', 'artist', 'user', 'venue', 'event_artist', 'gallery_image', 'billetto_event_data'];
const ACTIONS = ['INSERT', 'UPDATE', 'DELETE'] as const;

const ACTION_PILL: Record<string, string> = {
  INSERT: 'a-pill a-pill-upcoming',
  UPDATE: 'a-pill a-pill-draft',
  DELETE: 'a-pill a-pill-cancelled',
};

function formatTs(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('da-DK', { dateStyle: 'short', timeStyle: 'medium' });
}

function userName(entry: AuditLogEntry): string {
  if (!entry.user) return entry.userId ? entry.userId.slice(0, 8) + '…' : '—';
  const { firstName, lastName, email } = entry.user;
  if (firstName || lastName) return [firstName, lastName].filter(Boolean).join(' ');
  return email ?? '—';
}

export default function AuditLogsList() {
  const [page, setPage] = useState(1);
  const [tableFilter, setTableFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [result, setResult] = useState<AuditLogPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getAuditLogs({
        page,
        limit: 20,
        table: tableFilter || undefined,
        action: actionFilter || undefined,
      });
      if (res.data) {
        setResult(res.data);
      } else {
        setError(res.error ?? 'Failed to load logs');
      }
    } catch {
      setError('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [page, tableFilter, actionFilter]);

  useEffect(() => { void load(); }, [load]);

  // Reset to page 1 when filters change
  const setTableFilterAndReset = (v: string) => { setTableFilter(v); setPage(1); };
  const setActionFilterAndReset = (v: string) => { setActionFilter(v); setPage(1); };

  const toggleExpand = (id: number) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div>
      {/* Topbar */}
      <div className="a-topbar">
        <div>
          <h1 className="a-page-title">Logs</h1>
          <p className="a-page-sub">
            {result ? `${result.total.toLocaleString()} entries` : 'Audit trail'}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="a-toolbar">
        {/* Action filter */}
        <div className="a-chips">
          <button
            className={`a-chip${!actionFilter ? ' is-on' : ''}`}
            onClick={() => setActionFilterAndReset('')}
          >
            All actions
          </button>
          {ACTIONS.map(a => (
            <button
              key={a}
              className={`a-chip${actionFilter === a ? ' is-on' : ''}`}
              onClick={() => setActionFilterAndReset(actionFilter === a ? '' : a)}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Table filter */}
        <div className="a-chips" style={{ marginTop: 8 }}>
          <button
            className={`a-chip${!tableFilter ? ' is-on' : ''}`}
            onClick={() => setTableFilterAndReset('')}
          >
            All tables
          </button>
          {TABLES.map(t => (
            <button
              key={t}
              className={`a-chip${tableFilter === t ? ' is-on' : ''}`}
              onClick={() => setTableFilterAndReset(tableFilter === t ? '' : t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading && <p style={{ padding: '2rem', color: 'var(--ink-3)' }}>Loading…</p>}
      {error && <p style={{ padding: '2rem', color: 'var(--danger)' }}>{error}</p>}

      {!loading && result && (
        <>
          <div className="a-tbl-wrap">
            <table className="a-tbl">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Table</th>
                  <th>Entity ID</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {result.data.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '2rem' }}>
                      No log entries found
                    </td>
                  </tr>
                )}
                {result.data.map(entry => (
                  <React.Fragment key={entry.id}>
                    <tr
                      onClick={() => toggleExpand(entry.id)}
                      style={{ cursor: 'pointer' }}
                      title="Click to expand"
                    >
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--ink-2)', fontSize: 13 }}>
                        {formatTs(entry.createdAt)}
                      </td>
                      <td>
                        <span className={ACTION_PILL[entry.action] ?? 'a-pill'}>
                          {entry.action}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{entry.entityType}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--ink-2)' }}>
                        {entry.entityId ?? '—'}
                      </td>
                      <td style={{ fontSize: 13 }}>{userName(entry)}</td>
                    </tr>
                    {expandedId === entry.id && (
                      <tr>
                        <td colSpan={5} style={{ background: 'var(--bg)', padding: '0 1rem 1rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 4 }}>
                                OLD VALUES
                              </p>
                              <pre style={{
                                fontSize: 11, margin: 0, padding: '0.75rem',
                                background: 'var(--surface)', borderRadius: 6,
                                border: '1px solid var(--line)', overflow: 'auto', maxHeight: 260,
                              }}>
                                {entry.oldValues ? JSON.stringify(entry.oldValues, null, 2) : 'null'}
                              </pre>
                            </div>
                            <div>
                              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 4 }}>
                                NEW VALUES
                              </p>
                              <pre style={{
                                fontSize: 11, margin: 0, padding: '0.75rem',
                                background: 'var(--surface)', borderRadius: 6,
                                border: '1px solid var(--line)', overflow: 'auto', maxHeight: 260,
                              }}>
                                {entry.newValues ? JSON.stringify(entry.newValues, null, 2) : 'null'}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem 1.5rem' }}>
              <button
                className="a-btn a-btn-ghost a-btn-sm"
                onClick={() => setPage(p => p - 1)}
                disabled={page <= 1}
              >
                ← Prev
              </button>
              <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                Page {result.page} of {result.totalPages}
              </span>
              <button
                className="a-btn a-btn-ghost a-btn-sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= result.totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
