import { AuditLog } from '../models/AuditLog';
import { BaseRepository } from './BaseRepository';

export interface AuditLogQueryOptions {
  page: number;
  limit: number;
  table?: string;
  action?: string;
}

export class AuditLogRepository extends BaseRepository<AuditLog> {
  constructor() {
    super(AuditLog);
  }

  /**
   * Paginated audit logs (newest first) with the acting user joined, optionally
   * filtered by entity type (table) and action. Returns [rows, total].
   */
  async findPaginated({ page, limit, table, action }: AuditLogQueryOptions): Promise<[AuditLog[], number]> {
    const qb = this.repository.createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (table) qb.andWhere('log.entityType = :table', { table });
    if (action) qb.andWhere('log.action = :action', { action: action.toUpperCase() });

    return qb.getManyAndCount();
  }
}
