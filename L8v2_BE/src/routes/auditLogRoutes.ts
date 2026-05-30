import { Router, Response } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/authMiddleware';
import { AuditLogService } from '../services/AuditLogService';

const router = Router();
const auditLogService = new AuditLogService();

router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const table = req.query.table as string | undefined;
  const action = req.query.action as string | undefined;

  const result = await auditLogService.getAuditLogs({ page, limit, table, action });
  return res.json(result);
});

export default router;
