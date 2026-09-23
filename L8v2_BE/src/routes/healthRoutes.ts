import { Router, RequestHandler } from 'express';
import { AppDataSource } from '../config/database';

const router = Router();

/**
 * Upper bound on the readiness database probe.
 *
 * A database that *hangs* rather than refusing is the case this guards: without
 * a race, the query blocks, the health request blocks with it, and the caller
 * eventually times out with no idea why. Reporting unhealthy after 2s is both
 * faster and more informative than that.
 */
const DB_PROBE_TIMEOUT_MS = 2000;

async function isDatabaseReachable(): Promise<boolean> {
  if (!AppDataSource.isInitialized) return false;

  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), DB_PROBE_TIMEOUT_MS);
  });

  try {
    return await Promise.race([
      AppDataSource.query('SELECT 1').then(() => true, () => false),
      timeout,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: Liveness and readiness probes
 *
 * /api/health:
 *   get:
 *     summary: Liveness probe — is the process up and responsive?
 *     description: >
 *       Checks no dependencies and never returns 503, so a database outage can
 *       never cause a process supervisor to restart an otherwise healthy app.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: The process is running
 *
 * /api/health/ready:
 *   get:
 *     summary: Readiness probe — can the process actually serve requests?
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Ready — the database answered
 *       503:
 *         description: Not ready — the database is unreachable or too slow
 */

// Liveness. Deliberately dependency-free: the question is only whether this
// process is alive, which is the one thing a restart can fix.
const liveness: RequestHandler = (_req, res) => {
  // Set here rather than inherited: these routes mount above the /api no-store
  // middleware, and a cached 200 for a dead app defeats the whole endpoint.
  res.set('Cache-Control', 'no-store');
  res.status(200).json({ status: 'ok' });
};

// Readiness. The status code carries the signal — callers key on it, not the
// body — so an unhealthy result is a 503, never a 200 saying "unhealthy".
const readiness: RequestHandler = async (_req, res) => {
  res.set('Cache-Control', 'no-store');

  const databaseOk = await isDatabaseReachable();

  res.status(databaseOk ? 200 : 503).json({
    status: databaseOk ? 'ok' : 'unhealthy',
    checks: { database: databaseOk ? 'ok' : 'down' },
  });
};

router.get('/', liveness);
router.get('/ready', readiness);

export default router;
