import request from 'supertest';
import { createTestApp, createTestUser, getAuthToken, cleanupDatabase } from '../helpers';

const app = createTestApp();

const validEvent = {
  title: 'EventArtist Test Concert',
  description: 'An event for event-artist relation tests',
  date: '2026-09-15',
  startTime: '21:00',
};

const validArtist = {
  name: 'EventArtist Test Artist',
  bio: 'An artist for event-artist relation tests',
  genre: 'Electronic',
};

async function seedEventArtist() {
  const { user, plainPassword } = await createTestUser();
  const token = await getAuthToken(app, user.email, plainPassword);

  const eventRes = await request(app)
    .post('/api/events')
    .set('Authorization', `Bearer ${token}`)
    .send(validEvent);
  const eventId: string = eventRes.body.id;

  const artistRes = await request(app)
    .post('/api/artists')
    .set('Authorization', `Bearer ${token}`)
    .send(validArtist);
  const artistId: string = artistRes.body.id;

  const eaRes = await request(app)
    .post('/api/event-artists')
    .set('Authorization', `Bearer ${token}`)
    .send({ event: { id: eventId }, artist: { id: artistId } });
  const eventArtistId: string = eaRes.body.id;

  return { token, eventId, artistId, eventArtistId };
}

// ─── GET /api/event-artists ───────────────────────────────────────────────────

describe('GET /api/event-artists', () => {
  let eventArtistId: string;

  beforeAll(async () => {
    ({ eventArtistId } = await seedEventArtist());
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns 200 with an array', async () => {
    const res = await request(app).get('/api/event-artists');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('does not require authentication', async () => {
    const res = await request(app).get('/api/event-artists');
    expect(res.status).toBe(200);
  });

  it('includes seeded event-artist with loaded event and artist relations', async () => {
    const res = await request(app).get('/api/event-artists');
    const found = res.body.find((ea: { id: string }) => ea.id === eventArtistId);
    expect(found).toBeDefined();
    expect(found.event).toHaveProperty('id');
    expect(found.artist).toHaveProperty('id');
  });
});

// ─── GET /api/event-artists/:id ───────────────────────────────────────────────

describe('GET /api/event-artists/:id', () => {
  let eventArtistId: string;
  let eventId: string;
  let artistId: string;

  beforeAll(async () => {
    ({ eventArtistId, eventId, artistId } = await seedEventArtist());
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns 200 with the event-artist and its nested event and artist', async () => {
    const res = await request(app).get(`/api/event-artists/${eventArtistId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(eventArtistId);
    expect(res.body.event.id).toBe(eventId);
    expect(res.body.artist.id).toBe(artistId);
  });

  it('does not require authentication', async () => {
    const res = await request(app).get(`/api/event-artists/${eventArtistId}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 for a non-existent UUID', async () => {
    const res = await request(app).get('/api/event-artists/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/event artist not found/i);
  });
});

// ─── POST /api/event-artists ──────────────────────────────────────────────────

describe('POST /api/event-artists', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app)
      .post('/api/event-artists')
      .send({ event: { id: 'x' }, artist: { id: 'y' } });
    expect(res.status).toBe(401);
  });

  it('returns 400 when event field is missing', async () => {
    const { token, artistId } = await seedEventArtist();
    const res = await request(app)
      .post('/api/event-artists')
      .set('Authorization', `Bearer ${token}`)
      .send({ artist: { id: artistId } });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/event and artist are required/i);
  });

  it('returns 400 when artist field is missing', async () => {
    const { token, eventId } = await seedEventArtist();
    const res = await request(app)
      .post('/api/event-artists')
      .set('Authorization', `Bearer ${token}`)
      .send({ event: { id: eventId } });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/event and artist are required/i);
  });

  it('returns 400 when both event and artist are missing', async () => {
    const { user, plainPassword } = await createTestUser();
    const token = await getAuthToken(app, user.email, plainPassword);
    const res = await request(app)
      .post('/api/event-artists')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/event and artist are required/i);
  });

  it('returns 201 and creates the relationship with valid data', async () => {
    const { token, eventId, artistId } = await seedEventArtist();

    const artistRes = await request(app)
      .post('/api/artists')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Second Artist', bio: 'bio', genre: 'Jazz' });
    const secondArtistId: string = artistRes.body.id;

    const res = await request(app)
      .post('/api/event-artists')
      .set('Authorization', `Bearer ${token}`)
      .send({ event: { id: eventId }, artist: { id: secondArtistId } });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');

    void eventId;
    void artistId;
  });
});

// ─── PUT /api/event-artists/:id ───────────────────────────────────────────────

describe('PUT /api/event-artists/:id', () => {
  let token: string;
  let eventArtistId: string;

  beforeAll(async () => {
    ({ token, eventArtistId } = await seedEventArtist());
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app)
      .put(`/api/event-artists/${eventArtistId}`)
      .send({});
    expect(res.status).toBe(401);
  });

  it('returns 200 when updating an existing event-artist', async () => {
    const res = await request(app)
      .put(`/api/event-artists/${eventArtistId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(eventArtistId);
  });

  it('returns 404 for a non-existent event-artist', async () => {
    const res = await request(app)
      .put('/api/event-artists/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/event artist not found/i);
  });
});

// ─── DELETE /api/event-artists/:id ───────────────────────────────────────────

describe('DELETE /api/event-artists/:id', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const { eventArtistId } = await seedEventArtist();
    const res = await request(app).delete(`/api/event-artists/${eventArtistId}`);
    expect(res.status).toBe(401);
  });

  it('returns 204 on successful deletion', async () => {
    const { token, eventArtistId } = await seedEventArtist();
    const res = await request(app)
      .delete(`/api/event-artists/${eventArtistId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 when fetching a deleted event-artist', async () => {
    const { token, eventArtistId } = await seedEventArtist();
    await request(app)
      .delete(`/api/event-artists/${eventArtistId}`)
      .set('Authorization', `Bearer ${token}`);

    const getRes = await request(app).get(`/api/event-artists/${eventArtistId}`);
    expect(getRes.status).toBe(404);
  });

  it('returns 404 when deleting a non-existent event-artist', async () => {
    const { token } = await seedEventArtist();
    const res = await request(app)
      .delete('/api/event-artists/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/event-artists/event/:eventId/artist/:artistId ───────────────

describe('DELETE /api/event-artists/event/:eventId/artist/:artistId', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const { eventId, artistId } = await seedEventArtist();
    const res = await request(app).delete(
      `/api/event-artists/event/${eventId}/artist/${artistId}`
    );
    expect(res.status).toBe(401);
  });

  it('returns 200 with a confirmation message on successful removal', async () => {
    const { token, eventId, artistId } = await seedEventArtist();
    const res = await request(app)
      .delete(`/api/event-artists/event/${eventId}/artist/${artistId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('removedArtist');
    expect(res.body).toHaveProperty('eventTitle');
  });

  it('returns 404 when the relationship does not exist', async () => {
    const { token } = await seedEventArtist();
    const res = await request(app)
      .delete(
        '/api/event-artists/event/00000000-0000-0000-0000-000000000001/artist/00000000-0000-0000-0000-000000000002'
      )
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/artist not found in this event/i);
  });
});
