import { Router, RequestHandler, Request } from 'express';
import crypto from 'crypto';
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

// Verifies the Billetto-Signature HMAC-SHA256 header.
// Format: "t=<unix_ts>,v1=<hex>[,v1=<hex>...]"
// Signed string: "<t>.<rawBody>"
// Returns false if secret is missing, header is absent/malformed, timestamp is
// stale (>300 s), or no v1 value matches the expected digest.
function verifyBillettoSignature(req: Request): boolean {
  const secret = process.env.BILLETTO_WEBHOOK_SECRET;
  if (!secret) return false;

  const sigHeader = (req.headers['billetto-signature'] ?? '') as string;
  if (!sigHeader) return false;

  let t: string | undefined;
  const v1Sigs: string[] = [];
  for (const part of sigHeader.split(',')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    if (key === 't') t = val;
    else if (key === 'v1') v1Sigs.push(val);
  }
  if (!t || v1Sigs.length === 0) return false;

  const timestamp = parseInt(t, 10);
  if (!Number.isFinite(timestamp)) return false;
  // Replay protection: reject if |now - t| > 300 seconds
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) return false;

  const rawBody = req.rawBody ?? '';
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');

  return v1Sigs.some(sig => {
    try {
      return crypto.timingSafeEqual(expectedBuf, Buffer.from(sig, 'utf8'));
    } catch {
      // timingSafeEqual throws on length mismatch — treat as no-match
      return false;
    }
  });
}

// Webhook — authenticated by HMAC-SHA256 (Billetto-Signature header), NOT by JWT
const handleWebhook: RequestHandler = async (req, res) => {
  if (!verifyBillettoSignature(req)) {
    res.status(401).json({ message: 'Invalid webhook signature' });
    return;
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
