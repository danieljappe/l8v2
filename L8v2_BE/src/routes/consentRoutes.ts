import { Router, RequestHandler } from 'express';
import { ConsentService } from '../services/ConsentService';
import { consentLimiter } from '../middleware/rateLimiters';

const router = Router();
const consentService = new ConsentService();

/**
 * @swagger
 * tags:
 *   - name: Consent
 *     description: Cookie-consent proof log
 * /api/consent:
 *   post:
 *     summary: Record a cookie-consent decision
 *     description: >
 *       Stores the random consent id, the choices, the banner version and a
 *       server timestamp. Never stores the caller's IP address or user-agent.
 *     tags: [Consent]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [consentId, version, statistics, externalMedia]
 *             properties:
 *               consentId: { type: string, format: uuid }
 *               version: { type: integer, minimum: 1 }
 *               statistics: { type: boolean }
 *               externalMedia: { type: boolean }
 *     responses:
 *       201:
 *         description: Recorded
 *       400:
 *         description: Invalid payload
 *       429:
 *         description: Rate limited
 */
const recordConsent: RequestHandler = async (req, res, next) => {
  try {
    const result = await consentService.record(req.body);
    if (result.status === 'invalid') {
      res.status(400).json({ message: result.message });
      return;
    }
    res.status(201).json({ consentId: result.record.consentId, recordedAt: result.record.createdAt });
  } catch (error) {
    next(error);
  }
};

router.post('/', consentLimiter, recordConsent);

export default router;
