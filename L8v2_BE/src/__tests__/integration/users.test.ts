import request from 'supertest';
import { createTestApp, createTestUser, getAuthToken, cleanupDatabase } from '../helpers';

const app = createTestApp();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function seedUserWithAuth() {
  const { user, plainPassword } = await createTestUser();
  const token = await getAuthToken(app, user.email, plainPassword);
  return { user, token, plainPassword };
}

/** Fails if a `password` key appears anywhere in the payload, at any depth. */
function expectNoPassword(payload: unknown, path = 'body'): void {
  if (Array.isArray(payload)) {
    payload.forEach((item, i) => expectNoPassword(item, `${path}[${i}]`));
    return;
  }
  if (payload && typeof payload === 'object') {
    for (const [key, value] of Object.entries(payload)) {
      if (key === 'password') {
        throw new Error(`Password hash leaked at ${path}.${key}`);
      }
      expectNoPassword(value, `${path}.${key}`);
    }
  }
}

// ─── GET /api/users ───────────────────────────────────────────────────────────

describe('GET /api/users', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('returns 200 with an array for an authenticated caller', async () => {
    const { token } = await seedUserWithAuth();
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('never exposes the password hash', async () => {
    const { token } = await seedUserWithAuth();
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.length).toBeGreaterThan(0);
    expectNoPassword(res.body);
  });
});

// ─── GET /api/users/team ──────────────────────────────────────────────────────

describe('GET /api/users/team', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('is public and does not require a token', async () => {
    await createTestUser();
    const res = await request(app).get('/api/users/team');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('exposes only the public projection', async () => {
    await createTestUser();
    const res = await request(app).get('/api/users/team');

    expect(Object.keys(res.body[0]).sort()).toEqual(
      ['email', 'firstName', 'id', 'imageUrl', 'lastName', 'phoneNumber', 'role'].sort()
    );
    expectNoPassword(res.body);
  });

  it('is not shadowed by the /:id route', async () => {
    const res = await request(app).get('/api/users/team');
    // If Express matched /:id with id="team" this would be a 404 or a 401.
    expect(res.status).toBe(200);
  });
});

// ─── POST /api/users ──────────────────────────────────────────────────────────

describe('POST /api/users', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app).post('/api/users').send({
      firstName: 'New',
      lastName: 'User',
      email: 'new@example.com',
      password: 'Password123!',
    });
    expect(res.status).toBe(401);
  });

  it('returns 201 and the created user with a valid token', async () => {
    const { token } = await seedUserWithAuth();

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Created',
        lastName: 'User',
        email: `created-${Date.now()}@example.com`,
        password: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.firstName).toBe('Created');
    // Built in memory, so select:false does not cover it — the DTO must.
    expectNoPassword(res.body);
  });

  it('returns 400 when required fields are missing', async () => {
    const { token } = await seedUserWithAuth();

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Incomplete' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/missing required fields/i);
  });

  it('returns 409 when the email is already in use', async () => {
    const { user, token } = await seedUserWithAuth();

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Duplicate',
        lastName: 'User',
        email: user.email,
        password: 'Password123!',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });
});

// ─── GET /api/users/:id ───────────────────────────────────────────────────────

describe('GET /api/users/:id', () => {
  let createdUserId: string;
  let readToken: string;

  beforeAll(async () => {
    const { user, token } = await seedUserWithAuth();
    createdUserId = user.id;
    readToken = token;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app).get(`/api/users/${createdUserId}`);
    expect(res.status).toBe(401);
  });

  it('returns 200 for an existing user', async () => {
    const res = await request(app)
      .get(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${readToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdUserId);
    expectNoPassword(res.body);
  });

  it('returns 404 for a non-existent UUID', async () => {
    const res = await request(app)
      .get('/api/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${readToken}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/user not found/i);
  });
});

// ─── PUT /api/users/:id ───────────────────────────────────────────────────────

describe('PUT /api/users/:id', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const result = await seedUserWithAuth();
    token = result.token;
    userId = result.user.id;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .send({ firstName: 'Sneaky' });
    expect(res.status).toBe(401);
  });

  it('returns 200 and the updated user', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe('Updated');
    expect(res.body.id).toBe(userId);
    expectNoPassword(res.body);
  });

  it('persists the update across a subsequent GET', async () => {
    await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ lastName: 'Persisted' });

    const getRes = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.body.lastName).toBe('Persisted');
  });

  it('returns 404 for a non-existent user', async () => {
    const res = await request(app)
      .put('/api/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Ghost' });
    expect(res.status).toBe(404);
  });

  // Regression: User.password is select:false, so a load-merge-save cycle that
  // does not explicitly select it would write NULL back over the hash and lock
  // the user out. An unrelated field update must leave credentials intact.
  it('leaves the password hash intact after an unrelated field update', async () => {
    const { user, plainPassword } = await createTestUser();
    const ownToken = await getAuthToken(app, user.email, plainPassword);

    const updateRes = await request(app)
      .put(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${ownToken}`)
      .send({ phoneNumber: '+45 12 34 56 78' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.phoneNumber).toBe('+45 12 34 56 78');

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: plainPassword });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();
  });
});

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────

describe('DELETE /api/users/:id', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const { user } = await createTestUser();
    const res = await request(app).delete(`/api/users/${user.id}`);
    expect(res.status).toBe(401);
  });

  it('returns 204 on successful deletion', async () => {
    const { user, token } = await seedUserWithAuth();
    const res = await request(app)
      .delete(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 when fetching a deleted user', async () => {
    const { user, token } = await seedUserWithAuth();
    await request(app)
      .delete(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`);

    const getRes = await request(app)
      .get(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(404);
  });

  it('returns 404 when deleting a non-existent user', async () => {
    const { token } = await seedUserWithAuth();
    const res = await request(app)
      .delete('/api/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

// ─── PUT /api/users/:id/password ─────────────────────────────────────────────

describe('PUT /api/users/:id/password', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const { user } = await createTestUser();
    const res = await request(app)
      .put(`/api/users/${user.id}/password`)
      .send({ currentPassword: 'TestPassword123!', newPassword: 'NewPassword123!' });
    expect(res.status).toBe(401);
  });

  it('returns 403 when changing another user\'s password', async () => {
    const { token } = await seedUserWithAuth();
    const { user: otherUser } = await createTestUser();

    const res = await request(app)
      .put(`/api/users/${otherUser.id}/password`)
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'TestPassword123!', newPassword: 'NewPassword123!' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('returns 400 when required fields are missing', async () => {
    const { user, token } = await seedUserWithAuth();

    const res = await request(app)
      .put(`/api/users/${user.id}/password`)
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'TestPassword123!' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('returns 400 when new password is too short', async () => {
    const { user, token } = await seedUserWithAuth();

    const res = await request(app)
      .put(`/api/users/${user.id}/password`)
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'TestPassword123!', newPassword: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least 8 characters/i);
  });

  it('returns 401 when current password is incorrect', async () => {
    const { user, token } = await seedUserWithAuth();

    const res = await request(app)
      .put(`/api/users/${user.id}/password`)
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPassword!', newPassword: 'NewPassword123!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/incorrect/i);
  });

  it('returns 200 on a successful password change', async () => {
    const { user, token } = await seedUserWithAuth();

    const res = await request(app)
      .put(`/api/users/${user.id}/password`)
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'TestPassword123!', newPassword: 'NewPassword123!' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated successfully/i);
  });
});
