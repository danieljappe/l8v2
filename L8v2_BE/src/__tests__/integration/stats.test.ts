import request from 'supertest';
import { createTestApp, createTestUser, getAuthToken, cleanupDatabase } from '../helpers';

const app = createTestApp();

// ─── GET /api/stats ───────────────────────────────────────────────────────────

describe('GET /api/stats — empty database', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 200 without authentication', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
  });

  it('returns all five count fields as integers when the DB is empty', async () => {
    const res = await request(app).get('/api/stats');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      eventCount: 0,
      venueCount: 0,
      bookableArtistCount: 0,
      genreCount: 0,
      totalEventArtists: 0,
    });
  });

  it('returns numeric (not string) values for all counts', async () => {
    const res = await request(app).get('/api/stats');

    expect(typeof res.body.eventCount).toBe('number');
    expect(typeof res.body.venueCount).toBe('number');
    expect(typeof res.body.bookableArtistCount).toBe('number');
    expect(typeof res.body.genreCount).toBe('number');
    expect(typeof res.body.totalEventArtists).toBe('number');
  });
});

// ─── GET /api/stats — BVA: counts reflect seeded data ────────────────────────

describe('GET /api/stats — seeded data (BVA: 0 → 1 boundary)', () => {
  let token: string;

  beforeAll(async () => {
    const { user, plainPassword } = await createTestUser();
    token = await getAuthToken(app, user.email, plainPassword);
  });

  afterEach(async () => {
    await cleanupDatabase();
  });

  it('increments eventCount from 0 to 1 after creating one event', async () => {
    const before = await request(app).get('/api/stats');
    expect(before.body.eventCount).toBe(0);

    await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Stats Test Event', description: 'desc', date: '2026-09-01', startTime: '20:00' });

    const after = await request(app).get('/api/stats');
    expect(after.status).toBe(200);
    expect(after.body.eventCount).toBe(1);
  });

  it('increments venueCount from 0 to 1 after creating one venue', async () => {
    const before = await request(app).get('/api/stats');
    expect(before.body.venueCount).toBe(0);

    await request(app)
      .post('/api/venues')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Stats Test Venue', description: 'desc', address: 'Street 1', city: 'Copenhagen' });

    const after = await request(app).get('/api/stats');
    expect(after.body.venueCount).toBe(1);
  });

  it('increments bookableArtistCount when artist is bookable', async () => {
    await request(app)
      .post('/api/artists')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bookable Artist', bio: 'bio', genre: 'Jazz', isBookable: true });

    const res = await request(app).get('/api/stats');
    expect(res.body.bookableArtistCount).toBe(1);
  });

  it('does not increment bookableArtistCount when artist is not bookable', async () => {
    await request(app)
      .post('/api/artists')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Non-Bookable Artist', bio: 'bio', genre: 'Rock', isBookable: false });

    const res = await request(app).get('/api/stats');
    expect(res.body.bookableArtistCount).toBe(0);
  });

  it('counts distinct genres for bookable artists', async () => {
    const { user: u2, plainPassword: pw2 } = await createTestUser();
    const t2 = await getAuthToken(app, u2.email, pw2);

    await request(app)
      .post('/api/artists')
      .set('Authorization', `Bearer ${t2}`)
      .send({ name: 'Artist A', bio: 'bio', genre: 'Jazz', isBookable: true });

    await request(app)
      .post('/api/artists')
      .set('Authorization', `Bearer ${t2}`)
      .send({ name: 'Artist B', bio: 'bio', genre: 'Electronic', isBookable: true });

    await request(app)
      .post('/api/artists')
      .set('Authorization', `Bearer ${t2}`)
      .send({ name: 'Artist C', bio: 'bio', genre: 'Jazz', isBookable: true });

    const res = await request(app).get('/api/stats');
    expect(res.body.bookableArtistCount).toBe(3);
    expect(res.body.genreCount).toBe(2);
  });
});
