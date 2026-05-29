import request from 'supertest';
import { createTestApp, createTestUser, cleanupDatabase } from '../helpers';

const app = createTestApp();

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  // ── EQ: valid credentials ──────────────────────────────────────────────────

  it('returns 200 with a token and user object on valid credentials', async () => {
    const { user, plainPassword } = await createTestUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: plainPassword });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });

  it('returns a user object with expected fields on valid login', async () => {
    const { user, plainPassword } = await createTestUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: plainPassword });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    expect(res.body.user).toHaveProperty('imageUrl');
    expect(res.body.user).toHaveProperty('role');
  });

  it('does not include the password hash in the user response', async () => {
    const { user, plainPassword } = await createTestUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: plainPassword });

    expect(res.body.user).not.toHaveProperty('password');
  });

  // ── EQ: missing fields ─────────────────────────────────────────────────────

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'TestPassword123!' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email and password are required/i);
  });

  it('returns 400 when password is missing', async () => {
    const { user } = await createTestUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email and password are required/i);
  });

  it('returns 400 when both email and password are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email and password are required/i);
  });

  // ── BVA: empty string fields (falsy boundary) ─────────────────────────────

  it('returns 400 when email is an empty string (BVA: falsy boundary)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '', password: 'TestPassword123!' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email and password are required/i);
  });

  it('returns 400 when password is an empty string (BVA: falsy boundary)', async () => {
    const { user } = await createTestUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: '' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email and password are required/i);
  });

  // ── EQ: invalid credentials ────────────────────────────────────────────────

  it('returns 401 when the email does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'TestPassword123!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('returns 401 when the password is wrong', async () => {
    const { user } = await createTestUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  // ── Token usability check ─────────────────────────────────────────────────

  it('returned token can authenticate a protected endpoint', async () => {
    const { user, plainPassword } = await createTestUser();
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: plainPassword });

    const token = loginRes.body.token as string;
    const auditRes = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${token}`);

    expect(auditRes.status).toBe(200);
  });
});
