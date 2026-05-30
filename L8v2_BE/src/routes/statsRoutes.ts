import { Router, RequestHandler } from 'express';
import { StatsService } from '../services/StatsService';

const router = Router();
const statsService = new StatsService();

/**
 * GET /api/stats
 * Returns aggregate counts for the home page PinnedShowcase.
 */
const getStats: RequestHandler = async (_req, res) => {
  try {
    const stats = await statsService.getStats();
    res.json(stats);
  } catch {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

router.get('/', getStats);

export default router;
