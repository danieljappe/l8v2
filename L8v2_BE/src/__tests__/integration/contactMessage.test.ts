import request from 'supertest';
import { createTestApp, createTestUser, getAuthToken, cleanupDatabase } from '../helpers';

const app = createTestApp();

const validMessage = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  message: 'This is a valid contact message with enough characters.',
  subject: 'Booking inquiry',
};

// ─── POST /api/contact — EQ: required fields ──────────────────────────────────

describe('POST /api/contact — required field validation (EQ)', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 201 with a valid payload', async () => {
    const res = await request(app).post('/api/contact').send(validMessage);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe(validMessage.name);
    expect(res.body.email).toBe(validMessage.email.toLowerCase());
  });

  it('returns 400 when name is missing', async () => {
    const { name: _n, ...withoutName } = validMessage;
    void _n;
    const res = await request(app).post('/api/contact').send(withoutName);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name, email, and message are required/i);
  });

  it('returns 400 when email is missing', async () => {
    const { email: _e, ...withoutEmail } = validMessage;
    void _e;
    const res = await request(app).post('/api/contact').send(withoutEmail);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name, email, and message are required/i);
  });

  it('returns 400 when message is missing', async () => {
    const { message: _m, ...withoutMessage } = validMessage;
    void _m;
    const res = await request(app).post('/api/contact').send(withoutMessage);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name, email, and message are required/i);
  });

  it('returns 400 for an invalid email format (EQ: malformed email class)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...validMessage, email: 'notanemail' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid email format/i);
  });

  it('returns 400 for an email without TLD (EQ: partial email format)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...validMessage, email: 'user@nodot' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid email format/i);
  });
});

// ─── POST /api/contact — BVA: name length (boundary: 2–100 chars) ─────────────

describe('POST /api/contact — name length (BVA: 2–100 chars)', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 400 for name of length 1 (BVA: one below lower boundary)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...validMessage, name: 'A' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/between 2 and 100/i);
  });

  it('returns 201 for name of length 2 (BVA: lower boundary)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...validMessage, name: 'AB' });
    expect(res.status).toBe(201);
  });

  it('returns 201 for name of length 100 (BVA: upper boundary)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...validMessage, name: 'A'.repeat(100) });
    expect(res.status).toBe(201);
  });

  it('returns 400 for name of length 101 (BVA: one above upper boundary)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...validMessage, name: 'A'.repeat(101) });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/between 2 and 100/i);
  });
});

// ─── POST /api/contact — BVA: message length (boundary: 10–5000 chars) ────────

describe('POST /api/contact — message length (BVA: 10–5000 chars)', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 400 for message of length 9 (BVA: one below lower boundary)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...validMessage, message: 'A'.repeat(9) });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/between 10 and 5000/i);
  });

  it('returns 201 for message of length 10 (BVA: lower boundary)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...validMessage, message: 'A'.repeat(10) });
    expect(res.status).toBe(201);
  });

  it('returns 201 for message of length 5000 (BVA: upper boundary)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...validMessage, message: 'A'.repeat(5000) });
    expect(res.status).toBe(201);
  });

  it('returns 400 for message of length 5001 (BVA: one above upper boundary)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...validMessage, message: 'A'.repeat(5001) });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/between 10 and 5000/i);
  });
});

// ─── POST /api/contact — BVA: subject length (boundary: ≤200 chars) ──────────

describe('POST /api/contact — subject length (BVA: ≤200 chars)', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 201 for subject of length 200 (BVA: upper boundary)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...validMessage, subject: 'A'.repeat(200) });
    expect(res.status).toBe(201);
  });

  it('returns 400 for subject of length 201 (BVA: one above upper boundary)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...validMessage, subject: 'A'.repeat(201) });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/less than 200 characters/i);
  });

  it('returns 201 when subject is omitted (optional field)', async () => {
    const { subject: _s, ...withoutSubject } = validMessage;
    void _s;
    const res = await request(app).post('/api/contact').send(withoutSubject);
    expect(res.status).toBe(201);
  });
});

// ─── POST /api/contact — EQ: duplicate and per-email rate limiting ─────────────

describe('POST /api/contact — business-logic rate limits (EQ)', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 429 on duplicate submission within the same hour', async () => {
    await request(app).post('/api/contact').send(validMessage);
    const res = await request(app).post('/api/contact').send(validMessage);
    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/duplicate message/i);
  });

  it('returns 429 when the same email submits more than 5 messages', async () => {
    const email = `ratelimit-${Date.now()}@example.com`;

    for (let i = 1; i <= 5; i++) {
      await request(app)
        .post('/api/contact')
        .send({ ...validMessage, email, message: `Unique message number ${i} with enough chars.` });
    }

    const sixth = await request(app)
      .post('/api/contact')
      .send({
        ...validMessage,
        email,
        message: 'This sixth message should be blocked by the per-email rate limit.',
      });
    expect(sixth.status).toBe(429);
    expect(sixth.body.message).toMatch(/too many messages/i);
  });
});

// ─── GET /api/contact — auth required (EQ) ───────────────────────────────────

describe('GET /api/contact', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app).get('/api/contact');
    expect(res.status).toBe(401);
  });

  it('returns 200 with an array when authenticated', async () => {
    const { user, plainPassword } = await createTestUser();
    const token = await getAuthToken(app, user.email, plainPassword);
    const res = await request(app)
      .get('/api/contact')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── GET /api/contact/:id — auth required (EQ) ───────────────────────────────

describe('GET /api/contact/:id', () => {
  let token: string;
  let messageId: string;

  beforeAll(async () => {
    const { user, plainPassword } = await createTestUser();
    token = await getAuthToken(app, user.email, plainPassword);
    const res = await request(app).post('/api/contact').send(validMessage);
    messageId = res.body.id as string;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app).get(`/api/contact/${messageId}`);
    expect(res.status).toBe(401);
  });

  it('returns 200 for an existing message when authenticated', async () => {
    const res = await request(app)
      .get(`/api/contact/${messageId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(messageId);
  });

  it('returns 404 for a non-existent UUID', async () => {
    const res = await request(app)
      .get('/api/contact/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/contact message not found/i);
  });
});

// ─── PUT /api/contact/:id — auth required (EQ) ───────────────────────────────

describe('PUT /api/contact/:id', () => {
  let token: string;
  let messageId: string;

  beforeAll(async () => {
    const { user, plainPassword } = await createTestUser();
    token = await getAuthToken(app, user.email, plainPassword);
    const res = await request(app).post('/api/contact').send(validMessage);
    messageId = res.body.id as string;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app)
      .put(`/api/contact/${messageId}`)
      .send({ isRead: true });
    expect(res.status).toBe(401);
  });

  it('returns 200 and the updated message', async () => {
    const res = await request(app)
      .put(`/api/contact/${messageId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isRead: true });
    expect(res.status).toBe(200);
    expect(res.body.isRead).toBe(true);
  });

  it('returns 404 for a non-existent message', async () => {
    const res = await request(app)
      .put('/api/contact/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ isRead: true });
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/contact message not found/i);
  });
});

// ─── DELETE /api/contact/:id — auth required (EQ) ────────────────────────────

describe('DELETE /api/contact/:id', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const createRes = await request(app).post('/api/contact').send(validMessage);
    const res = await request(app).delete(`/api/contact/${createRes.body.id}`);
    expect(res.status).toBe(401);
  });

  it('returns 204 on successful deletion', async () => {
    const { user, plainPassword } = await createTestUser();
    const token = await getAuthToken(app, user.email, plainPassword);
    const createRes = await request(app)
      .post('/api/contact')
      .send({ ...validMessage, email: `del-${Date.now()}@example.com` });

    const res = await request(app)
      .delete(`/api/contact/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 when fetching a deleted message', async () => {
    const { user, plainPassword } = await createTestUser();
    const token = await getAuthToken(app, user.email, plainPassword);
    const createRes = await request(app)
      .post('/api/contact')
      .send({ ...validMessage, email: `del2-${Date.now()}@example.com` });
    const messageId: string = createRes.body.id;

    await request(app)
      .delete(`/api/contact/${messageId}`)
      .set('Authorization', `Bearer ${token}`);

    const getRes = await request(app)
      .get(`/api/contact/${messageId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(404);
  });

  it('returns 404 when deleting a non-existent message', async () => {
    const { user, plainPassword } = await createTestUser();
    const token = await getAuthToken(app, user.email, plainPassword);
    const res = await request(app)
      .delete('/api/contact/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/contact message not found/i);
  });
});
