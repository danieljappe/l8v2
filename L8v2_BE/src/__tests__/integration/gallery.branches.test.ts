import request from 'supertest';
import { createTestApp, createTestUser, getAuthToken, cleanupDatabase } from '../helpers';

const app = createTestApp();
const NON_EXISTENT = '00000000-0000-0000-0000-000000000000';

const imageBody = {
  filename: 'branch.jpg',
  url: '/uploads/gallery/branch.jpg',
  caption: 'Branch image',
  category: 'other',
  photographer: 'Admin',
  isPublished: true,
};

async function auth() {
  const { user, plainPassword } = await createTestUser();
  return getAuthToken(app, user.email, plainPassword);
}

describe('gallery — eventId validation + filter + not-found branches', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('GET /:id returns 404 for a non-existent image', async () => {
    const res = await request(app).get(`/api/gallery/${NON_EXISTENT}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/gallery image not found/i);
  });

  it('POST returns 400 for an invalid eventId', async () => {
    const token = await auth();
    const res = await request(app)
      .post('/api/gallery')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...imageBody, eventId: NON_EXISTENT });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid eventid/i);
  });

  it('PUT returns 400 for an invalid eventId', async () => {
    const token = await auth();
    const created = await request(app)
      .post('/api/gallery')
      .set('Authorization', `Bearer ${token}`)
      .send(imageBody);
    expect(created.status).toBe(201);

    const res = await request(app)
      .put(`/api/gallery/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: NON_EXISTENT });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid eventid/i);
  });

  it('PUT returns 404 for a non-existent image (valid/absent eventId)', async () => {
    const token = await auth();
    const res = await request(app)
      .put(`/api/gallery/${NON_EXISTENT}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ caption: 'Updated' });
    expect(res.status).toBe(404);
  });

  it('DELETE returns 404 for a non-existent image', async () => {
    const token = await auth();
    const res = await request(app)
      .delete(`/api/gallery/${NON_EXISTENT}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('GET ?eventId=&limit= returns only images for that event (ordered, capped)', async () => {
    const token = await auth();
    const event = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Gallery Event', description: 'x', date: '2099-06-06', startTime: '20:00' });

    await request(app)
      .post('/api/gallery')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...imageBody, filename: 'a.jpg', url: '/uploads/gallery/a.jpg', eventId: event.body.id });
    await request(app)
      .post('/api/gallery')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...imageBody, filename: 'b.jpg', url: '/uploads/gallery/b.jpg', eventId: event.body.id });

    const res = await request(app).get(`/api/gallery?eventId=${event.body.id}&limit=1`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].eventId).toBe(event.body.id);
  });
});
