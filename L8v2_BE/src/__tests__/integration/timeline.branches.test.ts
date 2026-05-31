import request from 'supertest';
import { createTestApp, createTestUser, getAuthToken, cleanupDatabase } from '../helpers';

const app = createTestApp();
const NON_EXISTENT = '00000000-0000-0000-0000-000000000000';

// Seeds an event with two artists linked as event-artists, so collab_set
// timeline items (uncovered by the main suite) can be exercised.
async function seedCollab() {
  const { user, plainPassword } = await createTestUser();
  const token = await getAuthToken(app, user.email, plainPassword);

  const event = await request(app)
    .post('/api/events')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Collab Event', description: 'x', date: '2099-08-08', startTime: '20:00' });

  async function linkArtist(name: string) {
    const artist = await request(app)
      .post('/api/artists')
      .set('Authorization', `Bearer ${token}`)
      .send({ name });
    const ea = await request(app)
      .post('/api/event-artists')
      .set('Authorization', `Bearer ${token}`)
      .send({ event: { id: event.body.id }, artist: { id: artist.body.id } });
    return { eventArtistId: ea.body.id as string, name };
  }

  const a = await linkArtist('Artist Alpha');
  const b = await linkArtist('Artist Beta');
  return { token, eventId: event.body.id as string, a, b };
}

describe('timeline — collab_set branches', () => {
  let token: string;
  let eventId: string;
  let eaA: string;
  let eaB: string;

  beforeAll(async () => {
    const seeded = await seedCollab();
    token = seeded.token;
    eventId = seeded.eventId;
    eaA = seeded.a.eventArtistId;
    eaB = seeded.b.eventArtistId;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('rejects collab_set with fewer than 2 collaboratorIds (400)', async () => {
    const res = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'collab_set', collaboratorIds: [eaA] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least 2/i);
  });

  it('rejects collab_set when a collaboratorId is not on the event (400)', async () => {
    const res = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'collab_set', collaboratorIds: [eaA, NON_EXISTENT] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/one or more collaboratorids not found/i);
  });

  it('creates a collab_set item and joins the artist names as the default title (201)', async () => {
    const res = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'collab_set', collaboratorIds: [eaA, eaB] });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Artist Alpha & Artist Beta');
    // The running-order view exposes the collaborators array
    expect(Array.isArray(res.body.collaborators)).toBe(true);
    expect(res.body.collaborators.length).toBe(2);
  });

  it('honours an explicit title override for collab_set (201)', async () => {
    const res = await request(app)
      .post(`/api/timeline/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'collab_set', collaboratorIds: [eaA, eaB], title: 'B2B Special' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('B2B Special');
  });
});
