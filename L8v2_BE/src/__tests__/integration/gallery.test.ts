import request from 'supertest';
import { createTestApp, createTestUser, getAuthToken, cleanupDatabase } from '../helpers';

const app = createTestApp();

const validGalleryImage = {
  filename: 'test-image.jpg',
  url: '/uploads/gallery/test-image.jpg',
  caption: 'Integration-test image',
  category: 'other',
  photographer: 'Test Photographer',
  isPublished: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function seedGalleryImageWithAuth(overrides: Partial<typeof validGalleryImage> = {}) {
  const { user, plainPassword } = await createTestUser();
  const token = await getAuthToken(app, user.email, plainPassword);
  const res = await request(app)
    .post('/api/gallery')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...validGalleryImage, ...overrides });
  return { token, imageId: res.body.id as string, res };
}

// ─── GET /api/gallery ─────────────────────────────────────────────────────────

describe('GET /api/gallery', () => {
  it('returns 200 with an array', async () => {
    const res = await request(app).get('/api/gallery');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('does not require authentication', async () => {
    const res = await request(app).get('/api/gallery');
    expect(res.status).toBe(200);
  });

  it('returns seeded images in the array', async () => {
    await seedGalleryImageWithAuth();
    const res = await request(app).get('/api/gallery');
    expect(res.body.length).toBeGreaterThan(0);
    const filenames = res.body.map((img: any) => img.filename);
    expect(filenames).toContain(validGalleryImage.filename);
    await cleanupDatabase();
  });
});

// ─── POST /api/gallery ────────────────────────────────────────────────────────

describe('POST /api/gallery', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app).post('/api/gallery').send(validGalleryImage);
    expect(res.status).toBe(401);
  });

  it('returns 201 and the created gallery image with a valid token', async () => {
    const { res } = await seedGalleryImageWithAuth();
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.filename).toBe(validGalleryImage.filename);
  });

  it('returns 400 when an invalid eventId is provided', async () => {
    const { user, plainPassword } = await createTestUser();
    const token = await getAuthToken(app, user.email, plainPassword);

    const res = await request(app)
      .post('/api/gallery')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validGalleryImage, eventId: '00000000-0000-0000-0000-000000000000' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid eventid/i);
  });
});

// ─── GET /api/gallery/:id ─────────────────────────────────────────────────────

describe('GET /api/gallery/:id', () => {
  let createdImageId: string;

  beforeAll(async () => {
    const { imageId } = await seedGalleryImageWithAuth();
    createdImageId = imageId;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns 200 for an existing gallery image', async () => {
    const res = await request(app).get(`/api/gallery/${createdImageId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdImageId);
    expect(res.body.filename).toBe(validGalleryImage.filename);
  });

  it('does not require authentication', async () => {
    const res = await request(app).get(`/api/gallery/${createdImageId}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 for a non-existent UUID', async () => {
    const res = await request(app).get('/api/gallery/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/gallery image not found/i);
  });
});

// ─── PUT /api/gallery/:id ─────────────────────────────────────────────────────

describe('PUT /api/gallery/:id', () => {
  let token: string;
  let imageId: string;

  beforeAll(async () => {
    const result = await seedGalleryImageWithAuth();
    token = result.token;
    imageId = result.imageId;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app)
      .put(`/api/gallery/${imageId}`)
      .send({ caption: 'Sneaky update' });
    expect(res.status).toBe(401);
  });

  it('returns 200 and the updated gallery image', async () => {
    const res = await request(app)
      .put(`/api/gallery/${imageId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ caption: 'Updated caption' });

    expect(res.status).toBe(200);
    expect(res.body.caption).toBe('Updated caption');
    expect(res.body.id).toBe(imageId);
  });

  it('persists the update across a subsequent GET', async () => {
    await request(app)
      .put(`/api/gallery/${imageId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ photographer: 'Updated Photographer' });

    const getRes = await request(app).get(`/api/gallery/${imageId}`);
    expect(getRes.body.photographer).toBe('Updated Photographer');
  });

  it('returns 404 for a non-existent gallery image', async () => {
    const res = await request(app)
      .put('/api/gallery/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ caption: 'Ghost' });
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/gallery/:id ──────────────────────────────────────────────────

describe('DELETE /api/gallery/:id', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const { imageId } = await seedGalleryImageWithAuth();
    const res = await request(app).delete(`/api/gallery/${imageId}`);
    expect(res.status).toBe(401);
  });

  it('returns 204 on successful deletion', async () => {
    const { token, imageId } = await seedGalleryImageWithAuth();
    const res = await request(app)
      .delete(`/api/gallery/${imageId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 when fetching a deleted gallery image', async () => {
    const { token, imageId } = await seedGalleryImageWithAuth();
    await request(app)
      .delete(`/api/gallery/${imageId}`)
      .set('Authorization', `Bearer ${token}`);

    const getRes = await request(app).get(`/api/gallery/${imageId}`);
    expect(getRes.status).toBe(404);
  });

  it('returns 404 when deleting a non-existent gallery image', async () => {
    const { user, plainPassword } = await createTestUser();
    const token = await getAuthToken(app, user.email, plainPassword);

    const res = await request(app)
      .delete('/api/gallery/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
