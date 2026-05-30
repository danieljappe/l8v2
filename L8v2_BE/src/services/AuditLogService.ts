import { AuditLogRepository, AuditLogQueryOptions } from '../repositories/AuditLogRepository';

const SENSITIVE_KEYS = ['password'];

function redactSensitiveFields(obj: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!obj) return null;
  const redacted = { ...obj };
  for (const key of SENSITIVE_KEYS) {
    if (key in redacted) redacted[key] = '[REDACTED]';
  }
  return redacted;
}

export interface AuditLogPage {
  data: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class AuditLogService {
  private auditLogRepository: AuditLogRepository;

  constructor() {
    this.auditLogRepository = new AuditLogRepository();
  }

  /** Paginated audit logs with sensitive fields on user rows redacted. */
  async getAuditLogs(options: AuditLogQueryOptions): Promise<AuditLogPage> {
    const { page, limit } = options;
    const [rows, total] = await this.auditLogRepository.findPaginated(options);

    const data = rows.map(row => ({
      ...row,
      oldValues: row.entityType === 'user' ? redactSensitiveFields(row.oldValues ?? null) : row.oldValues,
      newValues: row.entityType === 'user' ? redactSensitiveFields(row.newValues ?? null) : row.newValues,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
