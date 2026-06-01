/**
 * Regression test: unauthenticated writes must produce audit rows with userId = NULL
 * even when a previous authenticated request has leaked app.current_user_id into
 * the connection pool.
 *
 * Failing scenario (before fix):
 *   1. authMiddleware calls AppDataSource.query(set_config userId, false) on connection A.
 *   2. Connection A is released back to the pool with the session variable still set.
 *   3. An unauthenticated webhook fires and picks up connection A from the pool.
 *   4. The audit trigger reads app.current_user_id = userId → writes the wrong userId.
 *
 * Fix (App.ts global reset middleware):
 *   At the start of every request, AppDataSource.query(set_config '', false) clears
 *   the variable on whichever connection is acquired. In the sequential, low-concurrency
 *   scenario, this is the same connection that will be used for the subsequent write,
 *   so the audit trigger reads '' → NULL.
 */

import request from 'supertest';
import { AppDataSource } from '../../config/database';
import { BillettoEventData } from '../../models/BillettoEventData';
import { createTestApp, createTestUser, cleanupDatabase } from '../helpers';

const app = createTestApp();

describe('Audit attribution — connection pool contamination (Bug A)', () => {
  // The .env file sets BILLETTO_WEBHOOK_SECRET; clear it so the webhook
  // accepts requests without a secret (same pattern as billetto.test.ts).
  let savedWebhookSecret: string | undefined;
  beforeEach(() => {
    savedWebhookSecret = process.env.BILLETTO_WEBHOOK_SECRET;
    delete process.env.BILLETTO_WEBHOOK_SECRET;
  });
  afterEach(async () => {
    process.env.BILLETTO_WEBHOOK_SECRET = savedWebhookSecret;
    await cleanupDatabase();
  });

  it('webhook write has userId=NULL even when a previous auth session contaminated the pool', async () => {
    // ── 1. Pre-seed a BillettoEventData row that event.cancelled can update.
    //       Uses a direct repo call (no HTTP) so we control the seeding cleanly.
    const { user } = await createTestUser();

    const repo = AppDataSource.getRepository(BillettoEventData);
    const seeded = repo.create({
      billettoEventId: 'audit-regression-7777',
      publicUrl: 'https://billetto.dk/e/audit-regression',
      lastSyncedAt: new Date(),
      ticketsAvailable: 50,
    });
    await repo.save(seeded);

    // ── 2. Contaminate a pool connection — simulate what authMiddleware does
    //       after verifying a JWT.  This leaves app.current_user_id = user.id
    //       on connection A in the pool.
    await AppDataSource.query(
      `SELECT set_config('app.current_user_id', $1, false)`,
      [user.id]
    );

    // ── 3. Fire the unauthenticated webhook.
    //       No Authorization header → authenticateJWT is never called.
    //       The global reset middleware (App.ts) must clear the leaked variable
    //       before BillettoService writes billetto_event_data.
    const webhookRes = await request(app)
      .post('/api/billetto/webhook')
      .send({ type: 'event.cancelled', data: { id: 'audit-regression-7777' } });

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.received).toBe(true);

    // ── 4. Wait for async webhook processing (fire-and-forget after the 200).
    //       event.cancelled only updates an existing row (no external API call),
    //       so a short sleep is sufficient.
    await new Promise<void>(r => setTimeout(r, 200));

    // ── 5. Assert: the UPDATE audit row must have userId = NULL.
    const rows = await AppDataSource.query<{ userId: string | null; action: string }[]>(`
      SELECT "userId", action
      FROM audit_logs
      WHERE "entityType" = 'billetto_event_data'
        AND action = 'UPDATE'
      ORDER BY "createdAt" DESC
      LIMIT 1
    `);

    expect(rows).toHaveLength(1);
    expect(rows[0].userId).toBeNull();
  });
});
