import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createTestApp, createTestUser, getAuthToken, cleanupDatabase } from '../helpers';

const app = createTestApp();

const JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-key';

const validEvent = {
  title: 'Test Concert',
  description: 'An integration-test event',
  date: '2026-06-15',
  startTime: '20:00',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function seedEventWithAuth() {
  const { user, plainPassword } = await createTestUser();
  const token = await getAuthToken(app, user.email, plainPassword);
  const res = await request(app)
    .post('/api/events')
    .set('Authorization', `Bearer ${token}`)
    .send(validEvent);
  return { token, eventId: res.body.id as string };
}

// ─── GET /api/events ──────────────────────────────────────────────────────────

describe('GET /api/events', () => {
  it('returns 200 with an array', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('does not require authentication', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
  });
});

// ─── POST /api/events ─────────────────────────────────────────────────────────

describe('POST /api/events', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app).post('/api/events').send(validEvent);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token provided/i);
  });

  it('returns 401 with a malformed token (not a JWT)', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', 'Bearer not.a.jwt')
      .send(validEvent);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid token/i);
  });

  it('returns 401 with a token signed by the wrong secret', async () => {
    const badToken = jwt.sign({ id: 'fake-id' }, 'wrong-secret');
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${badToken}`)
      .send(validEvent);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid token/i);
  });

  it('returns 401 with an expired token', async () => {
    const expiredToken = jwt.sign({ id: 'some-id' }, JWT_SECRET, { expiresIn: -1 });
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send(validEvent);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid token/i);
  });

  it('returns 401 when the Authorization header lacks the Bearer prefix', async () => {
    const token = jwt.sign({ id: 'some-id' }, JWT_SECRET);
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', token) // no "Bearer " prefix
      .send(validEvent);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token provided/i);
  });

  it('returns 201 and the created event with a valid token', async () => {
    const { user, plainPassword } = await createTestUser();
    const token = await getAuthToken(app, user.email, plainPassword);

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send(validEvent);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe(validEvent.title);
  });
});

// ─── GET /api/events/:id ──────────────────────────────────────────────────────

describe('GET /api/events/:id', () => {
  let createdEventId: string;

  beforeAll(async () => {
    const { eventId } = await seedEventWithAuth();
    createdEventId = eventId;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns 200 for an existing event (by UUID)', async () => {
    const res = await request(app).get(`/api/events/${createdEventId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdEventId);
  });

  it('includes a timeline array built from the running-order view', async () => {
    const res = await request(app).get(`/api/events/${createdEventId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('timeline');
    expect(Array.isArray(res.body.timeline)).toBe(true);
    // No running-order rows seeded for this event → empty array.
    expect(res.body.timeline).toEqual([]);
  });

  it('returns 200 for an existing event (by slug)', async () => {
    // "Test Concert" slugifies to "test-concert"
    const res = await request(app).get('/api/events/test-concert');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe(validEvent.title);
  });

  it('returns 404 for a non-existent UUID', async () => {
    const res = await request(app).get('/api/events/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('returns 404 for an unknown slug', async () => {
    const res = await request(app).get('/api/events/no-such-event');
    expect(res.status).toBe(404);
  });

  it('does not require authentication', async () => {
    const res = await request(app).get(`/api/events/${createdEventId}`);
    expect(res.status).toBe(200);
  });
});

// ─── PUT /api/events/:id ──────────────────────────────────────────────────────

describe('PUT /api/events/:id', () => {
  let token: string;
  let eventId: string;

  beforeAll(async () => {
    const result = await seedEventWithAuth();
    token = result.token;
    eventId = result.eventId;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .send({ title: 'Updated' });
    expect(res.status).toBe(401);
  });

  it('returns 200 and the updated event with a valid token', async () => {
    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Concert' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Concert');
    expect(res.body.id).toBe(eventId);
  });

  it('persists the updated field across a subsequent GET', async () => {
    await request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Newly updated description' });

    const getRes = await request(app).get(`/api/events/${eventId}`);
    expect(getRes.body.description).toBe('Newly updated description');
  });

  it('returns 404 when updating a non-existent event', async () => {
    const res = await request(app)
      .put('/api/events/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Ghost Event' });
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/events/:id ───────────────────────────────────────────────────

describe('DELETE /api/events/:id', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const { eventId } = await seedEventWithAuth();
    const res = await request(app).delete(`/api/events/${eventId}`);
    expect(res.status).toBe(401);
  });

  it('returns 204 on successful deletion', async () => {
    const { token, eventId } = await seedEventWithAuth();
    const res = await request(app)
      .delete(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 when fetching a deleted event', async () => {
    const { token, eventId } = await seedEventWithAuth();
    await request(app)
      .delete(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`);

    const getRes = await request(app).get(`/api/events/${eventId}`);
    expect(getRes.status).toBe(404);
  });

  it('returns 404 when deleting a non-existent event', async () => {
    const { user, plainPassword } = await createTestUser();
    const token = await getAuthToken(app, user.email, plainPassword);

    const res = await request(app)
      .delete('/api/events/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('cascades child deletes (timeline items) within the delete and returns 204', async () => {
    const { token, eventId } = await seedEventWithAuth();

    // Seed a child record: a timeline item belonging to the event.
    const add = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'break', title: 'Intermission' });
    expect(add.status).toBe(201);

    const before = await request(app).get(`/api/timeline/${eventId}`);
    expect(before.body.length).toBe(1);

    const del = await request(app)
      .delete(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);

    // Child timeline rows are gone …
    const after = await request(app).get(`/api/timeline/${eventId}`);
    expect(after.body).toEqual([]);

    // … and so is the event itself.
    const getRes = await request(app).get(`/api/events/${eventId}`);
    expect(getRes.status).toBe(404);
  });
});

// ─── GET /api/events — upcoming / past / limit filters ────────────────────────

describe('GET /api/events — filters', () => {
  let token: string;

  beforeAll(async () => {
    const { user, plainPassword } = await createTestUser();
    token = await getAuthToken(app, user.email, plainPassword);
    await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Future Fest', description: 'upcoming', date: '2099-01-01', startTime: '20:00' });
    await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Past Fest', description: 'past', date: '2000-01-01', startTime: '20:00' });
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('?upcoming=true returns only future events', async () => {
    const res = await request(app).get('/api/events?upcoming=true');
    expect(res.status).toBe(200);
    const titles = res.body.map((e: { title: string }) => e.title);
    expect(titles).toContain('Future Fest');
    expect(titles).not.toContain('Past Fest');
  });

  it('?past=true returns only past events', async () => {
    const res = await request(app).get('/api/events?past=true');
    expect(res.status).toBe(200);
    const titles = res.body.map((e: { title: string }) => e.title);
    expect(titles).toContain('Past Fest');
    expect(titles).not.toContain('Future Fest');
  });

  it('?upcoming=true&limit=1 caps the number of rows', async () => {
    const res = await request(app).get('/api/events?upcoming=true&limit=1');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeLessThanOrEqual(1);
  });
});

// ─── Error / edge branches ────────────────────────────────────────────────────

describe('GET /api/events/:id — invalid identifier', () => {
  it('returns 400 for a whitespace-only identifier', async () => {
    const res = await request(app).get('/api/events/%20');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid event identifier/i);
  });
});

describe('POST /api/events — server error path', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 500 with an error field when required columns are missing', async () => {
    const { user, plainPassword } = await createTestUser();
    const token = await getAuthToken(app, user.email, plainPassword);

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({}); // missing title/description/date/startTime → NOT NULL violation

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Error creating event');
    expect(res.body).toHaveProperty('error');
  });
});

describe('PUT /api/events/:id — venueId handling', () => {
  let token: string;
  let eventId: string;

  beforeAll(async () => {
    const { user, plainPassword } = await createTestUser();
    token = await getAuthToken(app, user.email, plainPassword);
    const ev = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Venue Link Event', description: 'x', date: '2099-02-02', startTime: '20:00' });
    eventId = ev.body.id;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('accepts venueId: null (clears the relation)', async () => {
    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ venueId: null });
    expect(res.status).toBe(200);
  });

  it('sets the venue relation when given a valid venueId', async () => {
    const venue = await request(app)
      .post('/api/venues')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Linked Venue', address: 'Street 1', city: 'Copenhagen' });
    expect(venue.status).toBe(201);

    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ venueId: venue.body.id });

    expect(res.status).toBe(200);
    expect(res.body.venue?.id ?? res.body.venueId).toBe(venue.body.id);
  });
});
