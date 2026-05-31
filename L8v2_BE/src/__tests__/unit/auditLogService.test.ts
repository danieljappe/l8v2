import { AuditLogService } from '@/services/AuditLogService';

// Pure-logic unit tests for password redaction in AuditLogService.getAuditLogs —
// no database. The repository is stubbed and the service is built via
// Object.create so the DB-touching constructor never runs.

function buildService(rows: Record<string, unknown>[], total = rows.length): AuditLogService {
  const svc = Object.create(AuditLogService.prototype) as AuditLogService;
  (svc as unknown as { auditLogRepository: { findPaginated: () => Promise<[unknown[], number]> } })
    .auditLogRepository = { findPaginated: async () => [rows, total] };
  return svc;
}

describe('AuditLogService.getAuditLogs — password redaction', () => {
  it('redacts password fields on user-table rows (old and new values)', async () => {
    const svc = buildService([
      {
        entityType: 'user',
        oldValues: { password: 'old-secret', email: 'a@b.com' },
        newValues: { password: 'new-secret', email: 'a@b.com' },
      },
    ]);

    const page = await svc.getAuditLogs({ page: 1, limit: 20 });
    const row = page.data[0] as { oldValues: Record<string, unknown>; newValues: Record<string, unknown> };

    expect(row.oldValues.password).toBe('[REDACTED]');
    expect(row.newValues.password).toBe('[REDACTED]');
    // Non-sensitive fields are preserved
    expect(row.oldValues.email).toBe('a@b.com');
  });

  it('does NOT redact rows for non-user tables', async () => {
    const svc = buildService([
      {
        entityType: 'event',
        oldValues: { password: 'not-a-real-password-field' },
        newValues: { title: 'X' },
      },
    ]);

    const page = await svc.getAuditLogs({ page: 1, limit: 20 });
    const row = page.data[0] as { oldValues: Record<string, unknown> };

    expect(row.oldValues.password).toBe('not-a-real-password-field');
  });

  it('leaves null old/new values untouched on user rows', async () => {
    const svc = buildService([
      { entityType: 'user', oldValues: null, newValues: { password: 'x' } },
    ]);

    const page = await svc.getAuditLogs({ page: 1, limit: 20 });
    const row = page.data[0] as { oldValues: unknown; newValues: Record<string, unknown> };

    expect(row.oldValues).toBeNull();
    expect(row.newValues.password).toBe('[REDACTED]');
  });

  it('computes pagination metadata (totalPages = ceil(total/limit))', async () => {
    const svc = buildService([{ entityType: 'event' }], 25);
    const page = await svc.getAuditLogs({ page: 2, limit: 20 });
    expect(page.total).toBe(25);
    expect(page.page).toBe(2);
    expect(page.limit).toBe(20);
    expect(page.totalPages).toBe(2);
  });
});
