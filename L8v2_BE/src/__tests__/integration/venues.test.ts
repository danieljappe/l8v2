import request from 'supertest';
import { createTestApp, createTestUser, getAuthToken, cleanupDatabase } from '../helpers';

const app = createTestApp();

const validVenue = {
  name: 'Test Venue',
  description: 'An integration-test venue',
  address: 'Test Street 1',
  city: 'Copenhagen',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function seedVenueWithAuth(overrides: Partial<typeof validVenue> = {}) {
  const { user, plainPassword } = await createTestUser();
  const token = await getAuthToken(app, user.email, plainPassword);
  const res = await request(app)
    .post('/api/venues')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...validVenue, ...overrides });
  return { token, venueId: res.body.id as string, res };
}

// ─── GET /api/venues ──────────────────────────────────────────────────────────

describe('GET /api/venues', () => {
  it('returns 200 with an array', async () => {
    const res = await request(app).get('/api/venues');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('does not require authentication', async () => {
    const res = await request(app).get('/api/venues');
    expect(res.status).toBe(200);
  });

  it('returns seeded venues in the array', async () => {
    await seedVenueWithAuth();
    const res = await request(app).get('/api/venues');
    expect(res.body.length).toBeGreaterThan(0);
    const names = res.body.map((v: { name: string }) => v.name);
    expect(names).toContain(validVenue.name);
    await cleanupDatabase();
  });
});

// ─── POST /api/venues ─────────────────────────────────────────────────────────

describe('POST /api/venues', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app).post('/api/venues').send(validVenue);
    expect(res.status).toBe(401);
  });

  it('returns 201 and the created venue with a valid token', async () => {
    const { res } = await seedVenueWithAuth();
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe(validVenue.name);
    expect(res.body.address).toBe(validVenue.address);
  });

  it('includes expected fields in the response', async () => {
    const { res } = await seedVenueWithAuth();
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('createdAt');
  });
});

// ─── GET /api/venues/:id ──────────────────────────────────────────────────────

describe('GET /api/venues/:id', () => {
  let createdVenueId: string;

  beforeAll(async () => {
    const { venueId } = await seedVenueWithAuth();
    createdVenueId = venueId;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns 200 for an existing venue', async () => {
    const res = await request(app).get(`/api/venues/${createdVenueId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdVenueId);
    expect(res.body.name).toBe(validVenue.name);
  });

  it('does not require authentication', async () => {
    const res = await request(app).get(`/api/venues/${createdVenueId}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 for a non-existent UUID', async () => {
    const res = await request(app).get('/api/venues/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/venue not found/i);
  });
});

// ─── PUT /api/venues/:id ──────────────────────────────────────────────────────

describe('PUT /api/venues/:id', () => {
  let token: string;
  let venueId: string;

  beforeAll(async () => {
    const result = await seedVenueWithAuth();
    token = result.token;
    venueId = result.venueId;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app)
      .put(`/api/venues/${venueId}`)
      .send({ name: 'Sneaky Update' });
    expect(res.status).toBe(401);
  });

  it('returns 200 and the updated venue', async () => {
    const res = await request(app)
      .put(`/api/venues/${venueId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Venue Name', city: 'Aarhus' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Venue Name');
    expect(res.body.city).toBe('Aarhus');
    expect(res.body.id).toBe(venueId);
  });

  it('persists the update across a subsequent GET', async () => {
    await request(app)
      .put(`/api/venues/${venueId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Newly updated description' });

    const getRes = await request(app).get(`/api/venues/${venueId}`);
    expect(getRes.body.description).toBe('Newly updated description');
  });

  it('returns 404 for a non-existent venue', async () => {
    const res = await request(app)
      .put('/api/venues/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ghost Venue' });
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/venues/:id ───────────────────────────────────────────────────

describe('DELETE /api/venues/:id', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const { venueId } = await seedVenueWithAuth();
    const res = await request(app).delete(`/api/venues/${venueId}`);
    expect(res.status).toBe(401);
  });

  it('returns 204 on successful deletion', async () => {
    const { token, venueId } = await seedVenueWithAuth();
    const res = await request(app)
      .delete(`/api/venues/${venueId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 when fetching a deleted venue', async () => {
    const { token, venueId } = await seedVenueWithAuth();
    await request(app)
      .delete(`/api/venues/${venueId}`)
      .set('Authorization', `Bearer ${token}`);

    const getRes = await request(app).get(`/api/venues/${venueId}`);
    expect(getRes.status).toBe(404);
  });

  it('returns 404 when deleting a non-existent venue', async () => {
    const { user, plainPassword } = await createTestUser();
    const token = await getAuthToken(app, user.email, plainPassword);

    const res = await request(app)
      .delete('/api/venues/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
