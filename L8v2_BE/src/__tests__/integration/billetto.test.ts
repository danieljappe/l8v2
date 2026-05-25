import request from 'supertest';
import { createTestApp, createTestUser, getAuthToken, cleanupDatabase } from '../helpers';

const app = createTestApp();

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

describe('POST /api/billetto/webhook', () => {
  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns 200 and acknowledges when no secret is configured', async () => {
    // BILLETTO_WEBHOOK_SECRET is not set in the test environment
    const original = process.env.BILLETTO_WEBHOOK_SECRET;
    delete process.env.BILLETTO_WEBHOOK_SECRET;

    const res = await request(app)
      .post('/api/billetto/webhook')
      .send({ type: 'ticket.sold', data: {} });

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);

    process.env.BILLETTO_WEBHOOK_SECRET = original;
  });

  it('returns 401 when the provided secret does not match', async () => {
    process.env.BILLETTO_WEBHOOK_SECRET = 'correct-secret';

    const res = await request(app)
      .post('/api/billetto/webhook')
      .set('Authorization', 'Bearer wrong-secret')
      .send({ type: 'ticket.sold', data: {} });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid webhook secret/i);

    delete process.env.BILLETTO_WEBHOOK_SECRET;
  });

  it('returns 200 when the correct Bearer secret is provided', async () => {
    process.env.BILLETTO_WEBHOOK_SECRET = 'correct-secret';

    const res = await request(app)
      .post('/api/billetto/webhook')
      .set('Authorization', 'Bearer correct-secret')
      .send({ type: 'ticket.sold', data: {} });

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);

    delete process.env.BILLETTO_WEBHOOK_SECRET;
  });
});
