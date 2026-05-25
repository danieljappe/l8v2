import { Router, RequestHandler } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import { BillettoService } from '../services/BillettoService';

const router = Router();

// Lazy singleton — only instantiated on first request, not at module load time.
// This prevents test suites from crashing when Billetto env vars aren't set.
let _billettoService: BillettoService | null = null;
function getService(): BillettoService {
  if (!_billettoService) _billettoService = new BillettoService();
  return _billettoService;
}

/**
 * @swagger
 * tags:
 *   - name: Billetto
 *     description: Billetto event data sync
 *
 * /api/billetto/events:
 *   get:
 *     summary: List all synced Billetto event records
 *     tags: [Billetto]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of billetto_event_data records
 *
 * /api/billetto/sync:
 *   post:
 *     summary: Trigger a full sync of all Billetto events
 *     tags: [Billetto]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync summary
 *
 * /api/billetto/sync/{billettoEventId}:
 *   post:
 *     summary: Sync a single Billetto event by its Billetto ID
 *     tags: [Billetto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: billettoEventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated record
 *
 * /api/billetto/webhook:
 *   post:
 *     summary: Receive Billetto webhook events
 *     tags: [Billetto]
 *     responses:
 *       200:
 *         description: Acknowledged
 *       401:
 *         description: Invalid webhook secret
 */

const listEvents: RequestHandler = async (_req, res) => {
  try {
    const records = await getService().getAllRecords();
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch Billetto records', error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

const syncAll: RequestHandler = async (_req, res) => {
  try {
    const summary = await getService().syncAllEvents();
    res.json({ message: 'Sync complete', ...summary });
  } catch (err) {
    res.status(500).json({ message: 'Sync failed', error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

const syncOne: RequestHandler = async (req, res) => {
  try {
    const record = await getService().syncSingleEvent(req.params.billettoEventId);
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: 'Single sync failed', error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

// Webhook — authenticated by BILLETTO_WEBHOOK_SECRET, NOT by JWT
const handleWebhook: RequestHandler = async (req, res) => {
  const secret = process.env.BILLETTO_WEBHOOK_SECRET;

  if (secret) {
    // Billetto may send the secret as a Bearer token or in a custom header.
    // Check both; log the raw headers once so you can confirm the format.
    const authHeader = req.headers['authorization'] ?? '';
    const customHeader = req.headers['x-billetto-secret'] ?? req.headers['x-webhook-secret'] ?? '';
    const providedSecret = String(authHeader).replace('Bearer ', '') || String(customHeader);

    if (providedSecret !== secret) {
      console.warn('[Billetto Webhook] Invalid secret. Headers received:', req.headers);
      res.status(401).json({ message: 'Invalid webhook secret' });
      return;
    }
  }

  // Acknowledge immediately so Billetto doesn't retry
  res.status(200).json({ received: true });

  // Process asynchronously after responding.
  // Wrap in Promise.resolve().then() so a synchronous throw from getService()
  // (e.g. missing BILLETTO_API_KEY in non-prod environments) is caught rather
  // than becoming an unhandled rejection.
  Promise.resolve()
    .then(() => getService().handleWebhook(req.body))
    .catch((err) => {
      console.error('[Billetto Webhook] Processing error:', err);
    });
};

router.get('/events', authenticateJWT, listEvents);
router.post('/sync', authenticateJWT, syncAll);
router.post('/sync/:billettoEventId', authenticateJWT, syncOne);
router.get('/webhook', (_req, res) => res.status(200).json({ ok: true })); // Billetto endpoint verification
router.post('/webhook', handleWebhook);  // No JWT — uses webhook secret

export default router;
