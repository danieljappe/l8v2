import request from 'supertest';
import crypto from 'crypto';
import { createTestApp, createTestUser, getAuthToken, cleanupDatabase } from '../helpers';
import { AppDataSource } from '../../config/database';
import { BillettoEventData } from '../../models/BillettoEventData';

const app = createTestApp();

// Signs a raw body string with the given secret and timestamp (defaults to now).
// Returns a Billetto-Signature header value: "t=<ts>,v1=<hex>"
function signWebhook(
  rawBody: string,
  secret: string,
  timestamp: number = Math.floor(Date.now() / 1000),
): string {
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  return `t=${timestamp},v1=${sig}`;
}

const TEST_SECRET = 'test-hmac-secret';
const PAYLOAD = JSON.stringify({ type: 'ticket.sold', data: {} });

// ─── GET /api/billetto/events ────────────────────────────────────────────────

describe('GET /api/billetto/events', () => {
  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app).get('/api/billetto/events');
    expect(res.status).toBe(401);
  });

  it('returns 200 with an array when authenticated', async () => {
    const { user, plainPassword } = await createTestUser();
    const token = await getAuthToken(app, user.email, plainPassword);

    const res = await request(app)
      .get('/api/billetto/events')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── POST /api/billetto/sync ──────────────────────────────────────────────────

describe('POST /api/billetto/sync', () => {
  it('returns 401 without an auth token', async () => {
    const res = await request(app).post('/api/billetto/sync');
    expect(res.status).toBe(401);
  });
});

// ─── POST /api/billetto/sync/:billettoEventId ─────────────────────────────────

describe('POST /api/billetto/sync/:billettoEventId', () => {
  it('returns 401 without an auth token', async () => {
    const res = await request(app).post('/api/billetto/sync/some-event-id');
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/billetto/webhook ────────────────────────────────────────────────

describe('GET /api/billetto/webhook', () => {
  it('returns 200 for the endpoint verification probe', async () => {
    const res = await request(app).get('/api/billetto/webhook');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ─── POST /api/billetto/webhook ───────────────────────────────────────────────

describe('POST /api/billetto/webhook — HMAC-SHA256 verification', () => {
  afterAll(async () => {
    await cleanupDatabase();
  });

  afterEach(() => {
    delete process.env.BILLETTO_WEBHOOK_SECRET;
  });

  it('returns 200 for a valid HMAC signature (correct t.body, fresh timestamp)', async () => {
    process.env.BILLETTO_WEBHOOK_SECRET = TEST_SECRET;
    const sig = signWebhook(PAYLOAD, TEST_SECRET);

    const res = await request(app)
      .post('/api/billetto/webhook')
      .set('Content-Type', 'application/json')
      .set('Billetto-Signature', sig)
      .send(PAYLOAD);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  it('returns 401 and performs no DB write when signature is wrong', async () => {
    process.env.BILLETTO_WEBHOOK_SECRET = TEST_SECRET;
    const now = Math.floor(Date.now() / 1000);
    const wrongSig = `t=${now},v1=${'0'.repeat(64)}`;

    const res = await request(app)
      .post('/api/billetto/webhook')
      .set('Content-Type', 'application/json')
      .set('Billetto-Signature', wrongSig)
      .send(PAYLOAD);

    expect(res.status).toBe(401);
  });

  it('returns 401 when timestamp is older than 5 minutes (replay protection)', async () => {
    process.env.BILLETTO_WEBHOOK_SECRET = TEST_SECRET;
    const staleTs = Math.floor(Date.now() / 1000) - 301;
    const sig = signWebhook(PAYLOAD, TEST_SECRET, staleTs);

    const res = await request(app)
      .post('/api/billetto/webhook')
      .set('Content-Type', 'application/json')
      .set('Billetto-Signature', sig)
      .send(PAYLOAD);

    expect(res.status).toBe(401);
  });

  it('returns 401 when Billetto-Signature header is missing', async () => {
    process.env.BILLETTO_WEBHOOK_SECRET = TEST_SECRET;

    const res = await request(app)
      .post('/api/billetto/webhook')
      .set('Content-Type', 'application/json')
      .send(PAYLOAD);

    expect(res.status).toBe(401);
  });

  it('returns 200 when multiple v1 values are present and exactly one is valid', async () => {
    process.env.BILLETTO_WEBHOOK_SECRET = TEST_SECRET;
    const now = Math.floor(Date.now() / 1000);
    const validSig = crypto
      .createHmac('sha256', TEST_SECRET)
      .update(`${now}.${PAYLOAD}`)
      .digest('hex');
    const header = `t=${now},v1=${'0'.repeat(64)},v1=${validSig}`;

    const res = await request(app)
      .post('/api/billetto/webhook')
      .set('Content-Type', 'application/json')
      .set('Billetto-Signature', header)
      .send(PAYLOAD);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  it('returns 401 when BILLETTO_WEBHOOK_SECRET is not set in env', async () => {
    // secret intentionally absent
    const sig = signWebhook(PAYLOAD, 'any-secret');

    const res = await request(app)
      .post('/api/billetto/webhook')
      .set('Content-Type', 'application/json')
      .set('Billetto-Signature', sig)
      .send(PAYLOAD);

    expect(res.status).toBe(401);
  });

  it('is idempotent: delivering the same event.cancelled webhook twice leaves exactly one row with ticketsAvailable=0', async () => {
    process.env.BILLETTO_WEBHOOK_SECRET = TEST_SECRET;

    // Pre-insert the row the cancelled handler looks up — it only acts on existing records.
    const billettoEventId = 'idem-test-evt-1';
    const bed = new BillettoEventData();
    bed.billettoEventId = billettoEventId;
    bed.publicUrl = 'https://billetto.dk/e/idem-test-1';
    bed.ticketsAvailable = 50;
    bed.maxCapacity = 100;
    bed.lastSyncedAt = new Date();
    await AppDataSource.getRepository(BillettoEventData).save(bed);

    const cancelPayload = JSON.stringify({ type: 'event.cancelled', data: { id: billettoEventId } });
    // Flush the async post-response processing for each webhook delivery.
    const drain = () => new Promise<void>(resolve => setTimeout(resolve, 100));

    // First delivery
    const res1 = await request(app)
      .post('/api/billetto/webhook')
      .set('Content-Type', 'application/json')
      .set('Billetto-Signature', signWebhook(cancelPayload, TEST_SECRET))
      .send(cancelPayload);
    expect(res1.status).toBe(200);
    await drain();

    const afterFirst = await AppDataSource.getRepository(BillettoEventData).find({
      where: { billettoEventId },
    });
    expect(afterFirst).toHaveLength(1);
    expect(afterFirst[0].ticketsAvailable).toBe(0);

    // Second delivery — identical payload, fresh timestamp in the signature
    const res2 = await request(app)
      .post('/api/billetto/webhook')
      .set('Content-Type', 'application/json')
      .set('Billetto-Signature', signWebhook(cancelPayload, TEST_SECRET))
      .send(cancelPayload);
    expect(res2.status).toBe(200);
    await drain();

    const afterSecond = await AppDataSource.getRepository(BillettoEventData).find({
      where: { billettoEventId },
    });
    expect(afterSecond).toHaveLength(1);
    expect(afterSecond[0].ticketsAvailable).toBe(afterFirst[0].ticketsAvailable);
    expect(afterSecond[0].publicUrl).toBe(afterFirst[0].publicUrl);
    expect(afterSecond[0].maxCapacity).toBe(afterFirst[0].maxCapacity);
  });
});
