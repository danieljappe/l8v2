import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { AuditLog } from '../models/AuditLog';
import { authenticateJWT, AuthRequest } from '../middleware/authMiddleware';
import { Response } from 'express';

const router = Router();

const SENSITIVE_KEYS = ['password'];

function redactSensitiveFields(obj: Record<string, unknown> | null): Record<string, unknown> | null {
    if (!obj) return null;
    const redacted = { ...obj };
    for (const key of SENSITIVE_KEYS) {
        if (key in redacted) redacted[key] = '[REDACTED]';
    }
    return redacted;
}

router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const table = req.query.table as string | undefined;
    const action = req.query.action as string | undefined;

    const repo = AppDataSource.getRepository(AuditLog);

    const qb = repo.createQueryBuilder('log')
        .leftJoinAndSelect('log.user', 'user')
        .orderBy('log.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

    if (table) qb.andWhere('log.entityType = :table', { table });
    if (action) qb.andWhere('log.action = :action', { action: action.toUpperCase() });

    const [rows, total] = await qb.getManyAndCount();

    const data = rows.map(row => ({
        ...row,
        oldValues: row.entityType === 'user' ? redactSensitiveFields(row.oldValues ?? null) : row.oldValues,
        newValues: row.entityType === 'user' ? redactSensitiveFields(row.newValues ?? null) : row.newValues,
    }));

    return res.json({
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    });
});

export default router;
