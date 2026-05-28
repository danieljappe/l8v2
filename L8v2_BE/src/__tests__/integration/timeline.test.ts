import request from 'supertest';
import { createTestApp, createTestUser, getAuthToken, cleanupDatabase } from '../helpers';

const app = createTestApp();

// ─── Seed helpers ─────────────────────────────────────────────────────────────

const validEvent = {
  title: 'Timeline Test Concert',
  description: 'A timeline integration-test event',
  date: '2026-08-01',
  startTime: '20:00',
};

async function seedEventAndArtist() {
  const { user, plainPassword } = await createTestUser();
  const token = await getAuthToken(app, user.email, plainPassword);

  const eventRes = await request(app)
    .post('/api/events')
    .set('Authorization', `Bearer ${token}`)
    .send(validEvent);
  const eventId = eventRes.body.id as string;

  const artistRes = await request(app)
    .post('/api/artists')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Timeline Artist', genre: 'Electronic' });
  const artistId = artistRes.body.id as string;

  const eaRes = await request(app)
    .post('/api/event-artists')
    .set('Authorization', `Bearer ${token}`)
    .send({ event: { id: eventId }, artist: { id: artistId } });
  const eventArtistId = eaRes.body.id as string;

  return { token, eventId, artistId, eventArtistId };
}

// ─── GET /api/timeline/:eventId ───────────────────────────────────────────────

describe('GET /api/timeline/:eventId', () => {
  afterEach(cleanupDatabase);

  it('returns 200 with an empty array for an event with no timeline items', async () => {
    const { eventId } = await seedEventAndArtist();
    const res = await request(app).get(`/api/timeline/${eventId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it('does not require authentication', async () => {
    const { eventId } = await seedEventAndArtist();
    const res = await request(app).get(`/api/timeline/${eventId}`);
    expect(res.status).toBe(200);
  });

  it('returns items in ascending position order', async () => {
    const { token, eventId, eventArtistId } = await seedEventAndArtist();

    for (const pos of [1, 2, 3]) {
      await request(app)
        .post(`/api/timeline/${eventId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(pos === 2
          ? { type: 'break', title: 'Break' }
          : { type: 'artist_set', eventArtistId }
        );
    }

    const res = await request(app).get(`/api/timeline/${eventId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body.map((i: { position: number }) => i.position)).toEqual([1, 2, 3]);
  });

  it('includes artist details for artist_set items', async () => {
    const { token, eventId, eventArtistId } = await seedEventAndArtist();
    await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'artist_set', eventArtistId });

    const res = await request(app).get(`/api/timeline/${eventId}`);
    expect(res.status).toBe(200);
    expect(res.body[0].artistName).toBe('Timeline Artist');
    expect(res.body[0].artistGenre).toBe('Electronic');
  });
});

// ─── POST /api/timeline/:eventId ──────────────────────────────────────────────

describe('POST /api/timeline/:eventId', () => {
  afterEach(cleanupDatabase);

  it('returns 401 without an auth token', async () => {
    const { eventId, eventArtistId } = await seedEventAndArtist();
    const res = await request(app)
      .post(`/api/timeline/${eventId}`)
      .send({ type: 'artist_set', eventArtistId });
    expect(res.status).toBe(401);
  });

  it('creates an artist_set item and snapshots the artist name as title', async () => {
    const { token, eventId, eventArtistId } = await seedEventAndArtist();
    const res = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'artist_set', eventArtistId });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Timeline Artist');
    expect(res.body.type).toBe('artist_set');
    expect(res.body.position).toBe(1);
  });

  it('creates a break item without an eventArtistId', async () => {
    const { token, eventId } = await seedEventAndArtist();
    const res = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'break', title: 'Short Break' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Short Break');
    expect(res.body.type).toBe('break');
  });

  it('assigns sequential positions', async () => {
    const { token, eventId, eventArtistId } = await seedEventAndArtist();

    const r1 = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'artist_set', eventArtistId });
    const r2 = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'break', title: 'Break' });

    expect(r1.body.position).toBe(1);
    expect(r2.body.position).toBe(2);
  });

  it('returns 400 when artist_set is missing eventArtistId', async () => {
    const { token, eventId } = await seedEventAndArtist();
    const res = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'artist_set', title: 'Missing EA' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/eventArtistId is required/i);
  });

  it('returns 400 when a non-artist_set item supplies eventArtistId', async () => {
    const { token, eventId, eventArtistId } = await seedEventAndArtist();
    const res = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'break', title: 'Break', eventArtistId });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/eventArtistId must be null/i);
  });

  it('returns 400 when eventArtistId does not belong to this event', async () => {
    const { token, eventId } = await seedEventAndArtist();
    const res = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'artist_set', eventArtistId: '00000000-0000-0000-0000-000000000000' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not found for this event/i);
  });

  it('returns 400 for an invalid type', async () => {
    const { token, eventId } = await seedEventAndArtist();
    const res = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'concert', title: 'Bad type' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid type/i);
  });

  it('allows a custom title override for artist_set', async () => {
    const { token, eventId, eventArtistId } = await seedEventAndArtist();
    const res = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'artist_set', eventArtistId, title: 'Custom Title' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Custom Title');
  });
});

// ─── PUT /api/timeline/:eventId/reorder ───────────────────────────────────────

describe('PUT /api/timeline/:eventId/reorder', () => {
  afterEach(cleanupDatabase);

  it('returns 401 without an auth token', async () => {
    const { eventId } = await seedEventAndArtist();
    const res = await request(app)
      .put(`/api/timeline/${eventId}/reorder`)
      .send({ items: [] });
    expect(res.status).toBe(401);
  });

  it('reorders items and persists the new positions', async () => {
    const { token, eventId, eventArtistId } = await seedEventAndArtist();

    const r1 = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'artist_set', eventArtistId });
    const r2 = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'break', title: 'Break' });
    const r3 = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'custom', title: 'Custom' });

    const id1 = r1.body.id as string;
    const id2 = r2.body.id as string;
    const id3 = r3.body.id as string;

    // Reverse the order
    const reorderRes = await request(app)
      .put(`/api/timeline/${eventId}/reorder`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ id: id3, position: 1 }, { id: id2, position: 2 }, { id: id1, position: 3 }] });

    expect(reorderRes.status).toBe(200);

    const getRes = await request(app).get(`/api/timeline/${eventId}`);
    const positions = getRes.body.map((i: { id: string; position: number }) => ({ id: i.id, pos: i.position }));
    expect(positions.find((p: { id: string }) => p.id === id3)?.pos).toBe(1);
    expect(positions.find((p: { id: string }) => p.id === id2)?.pos).toBe(2);
    expect(positions.find((p: { id: string }) => p.id === id1)?.pos).toBe(3);
  });

  it('returns 400 when an item ID does not belong to the event', async () => {
    const { token, eventId } = await seedEventAndArtist();
    const res = await request(app)
      .put(`/api/timeline/${eventId}/reorder`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ id: '00000000-0000-0000-0000-000000000000', position: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/do not belong to this event/i);
  });

  it('returns 400 with an empty items array', async () => {
    const { token, eventId } = await seedEventAndArtist();
    const res = await request(app)
      .put(`/api/timeline/${eventId}/reorder`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [] });
    expect(res.status).toBe(400);
  });
});

// ─── PATCH /api/timeline/:eventId/items/:itemId ───────────────────────────────

describe('PATCH /api/timeline/:eventId/items/:itemId', () => {
  afterEach(cleanupDatabase);

  it('returns 401 without an auth token', async () => {
    const { eventId, eventArtistId, token } = await seedEventAndArtist();
    const item = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'artist_set', eventArtistId });

    const res = await request(app)
      .patch(`/api/timeline/${eventId}/items/${item.body.id}`)
      .send({ title: 'Updated' });
    expect(res.status).toBe(401);
  });

  it('updates title, startTime, durationMinutes, and notes', async () => {
    const { token, eventId, eventArtistId } = await seedEventAndArtist();
    const item = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'artist_set', eventArtistId });

    const res = await request(app)
      .patch(`/api/timeline/${eventId}/items/${item.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Headline Set', startTime: '22:00', durationMinutes: 75, notes: 'Bring extra cables' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Headline Set');
    expect(res.body.startTime).toBe('22:00');
    expect(res.body.durationMinutes).toBe(75);
    expect(res.body.notes).toBe('Bring extra cables');
  });

  it('returns 404 for an unknown item ID', async () => {
    const { token, eventId } = await seedEventAndArtist();
    const res = await request(app)
      .patch(`/api/timeline/${eventId}/items/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Ghost' });
    expect(res.status).toBe(404);
  });

  it('returns 404 when the item belongs to a different event', async () => {
    const { token, eventId, eventArtistId } = await seedEventAndArtist();
    const item = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'artist_set', eventArtistId });

    // Create a second event and try to patch the first event's item via its URL
    const otherEvent = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validEvent, title: 'Other Event' });

    const res = await request(app)
      .patch(`/api/timeline/${otherEvent.body.id}/items/${item.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Should fail' });
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/timeline/:eventId/items/:itemId ──────────────────────────────

describe('DELETE /api/timeline/:eventId/items/:itemId', () => {
  afterEach(cleanupDatabase);

  it('returns 401 without an auth token', async () => {
    const { eventId, eventArtistId, token } = await seedEventAndArtist();
    const item = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'artist_set', eventArtistId });

    const res = await request(app)
      .delete(`/api/timeline/${eventId}/items/${item.body.id}`);
    expect(res.status).toBe(401);
  });

  it('returns 204 on successful deletion', async () => {
    const { token, eventId } = await seedEventAndArtist();
    const item = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'break', title: 'Break' });

    const res = await request(app)
      .delete(`/api/timeline/${eventId}/items/${item.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('item is gone after deletion', async () => {
    const { token, eventId } = await seedEventAndArtist();
    const item = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'break', title: 'Break' });

    await request(app)
      .delete(`/api/timeline/${eventId}/items/${item.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    const getRes = await request(app).get(`/api/timeline/${eventId}`);
    expect(getRes.body.find((i: { id: string }) => i.id === item.body.id)).toBeUndefined();
  });

  it('trigger renumbers remaining items after deletion (no gaps)', async () => {
    const { token, eventId, eventArtistId } = await seedEventAndArtist();

    const r1 = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'artist_set', eventArtistId });
    const r2 = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'break', title: 'Break' });
    const r3 = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'custom', title: 'Custom' });

    // Delete the middle item
    await request(app)
      .delete(`/api/timeline/${eventId}/items/${r2.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    const getRes = await request(app).get(`/api/timeline/${eventId}`);
    expect(getRes.body).toHaveLength(2);
    const positions = getRes.body.map((i: { position: number }) => i.position).sort();
    expect(positions).toEqual([1, 2]);

    // Original first and last items should still be present
    const ids = getRes.body.map((i: { id: string }) => i.id);
    expect(ids).toContain(r1.body.id);
    expect(ids).toContain(r3.body.id);
  });

  it('returns 404 for an unknown item', async () => {
    const { token, eventId } = await seedEventAndArtist();
    const res = await request(app)
      .delete(`/api/timeline/${eventId}/items/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
