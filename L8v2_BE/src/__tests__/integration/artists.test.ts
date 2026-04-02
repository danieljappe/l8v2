import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createTestApp, createTestUser, getAuthToken, cleanupDatabase } from '../helpers';

const app = createTestApp();

const JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-key';

const validArtist = {
  name: 'Test Artist',
  bio: 'Integration-test artist',
  genre: 'Electronic',
};

const SPOTIFY_EMBED =
  '<iframe src="https://open.spotify.com/embed/track/4iV5W9uYEdYUVa79Axb7Rh" width="300" height="80" frameborder="0"></iframe>';

const YOUTUBE_EMBED =
  '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Test Video" frameborder="0"></iframe>';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function seedArtistWithAuth(overrides: Partial<typeof validArtist> = {}) {
  const { user, plainPassword } = await createTestUser();
  const token = await getAuthToken(app, user.email, plainPassword);
  const res = await request(app)
    .post('/api/artists')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...validArtist, ...overrides });
  return { token, artistId: res.body.id as string, res };
}

// ─── GET /api/artists ─────────────────────────────────────────────────────────

describe('GET /api/artists', () => {
  it('returns 200 with an array', async () => {
    const res = await request(app).get('/api/artists');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('does not require authentication', async () => {
    const res = await request(app).get('/api/artists');
    expect(res.status).toBe(200);
  });

  it('returns seeded artists in the array', async () => {
    await seedArtistWithAuth();
    const res = await request(app).get('/api/artists');
    expect(res.body.length).toBeGreaterThan(0);
    const names = res.body.map((a: any) => a.name);
    expect(names).toContain(validArtist.name);
    await cleanupDatabase();
  });
});

// ─── POST /api/artists ────────────────────────────────────────────────────────

describe('POST /api/artists', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  // Auth middleware
  it('returns 401 without an auth token', async () => {
    const res = await request(app).post('/api/artists').send(validArtist);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token provided/i);
  });

  it('returns 401 with a malformed token', async () => {
    const res = await request(app)
      .post('/api/artists')
      .set('Authorization', 'Bearer not.a.valid.jwt')
      .send(validArtist);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid token/i);
  });

  it('returns 401 with a token signed by the wrong secret', async () => {
    const badToken = jwt.sign({ id: 'fake' }, 'wrong-secret');
    const res = await request(app)
      .post('/api/artists')
      .set('Authorization', `Bearer ${badToken}`)
      .send(validArtist);
    expect(res.status).toBe(401);
  });

  it('returns 401 with an expired token', async () => {
    const expiredToken = jwt.sign({ id: 'some-id' }, JWT_SECRET, { expiresIn: -1 });
    const res = await request(app)
      .post('/api/artists')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send(validArtist);
    expect(res.status).toBe(401);
  });

  it('returns 401 when Authorization header lacks the Bearer prefix', async () => {
    const token = jwt.sign({ id: 'some-id' }, JWT_SECRET);
    const res = await request(app)
      .post('/api/artists')
      .set('Authorization', token)
      .send(validArtist);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token provided/i);
  });

  // Happy path
  it('returns 201 and the created artist with a valid token', async () => {
    const { res } = await seedArtistWithAuth();
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe(validArtist.name);
    expect(res.body.genre).toBe(validArtist.genre);
  });

  it('includes expected fields in the response', async () => {
    const { res } = await seedArtistWithAuth();
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('createdAt');
  });

  it('creates an artist with an initial Spotify embedding', async () => {
    const { user, plainPassword } = await createTestUser();
    const token = await getAuthToken(app, user.email, plainPassword);

    const res = await request(app)
      .post('/api/artists')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...validArtist,
        embeddings: [{ embedCode: SPOTIFY_EMBED, platform: 'spotify' }],
      });

    expect(res.status).toBe(201);
    expect(Array.isArray(res.body.embeddings)).toBe(true);
    expect(res.body.embeddings.length).toBe(1);
    expect(res.body.embeddings[0].platform).toBe('spotify');
  });
});

// ─── GET /api/artists/:id ─────────────────────────────────────────────────────

describe('GET /api/artists/:id', () => {
  let createdArtistId: string;

  beforeAll(async () => {
    const { artistId } = await seedArtistWithAuth();
    createdArtistId = artistId;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns 200 for an existing artist', async () => {
    const res = await request(app).get(`/api/artists/${createdArtistId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdArtistId);
    expect(res.body.name).toBe(validArtist.name);
  });

  it('does not require authentication', async () => {
    const res = await request(app).get(`/api/artists/${createdArtistId}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 for a non-existent UUID', async () => {
    const res = await request(app).get('/api/artists/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/artist not found/i);
  });
});

// ─── PUT /api/artists/:id ─────────────────────────────────────────────────────

describe('PUT /api/artists/:id', () => {
  let token: string;
  let artistId: string;

  beforeAll(async () => {
    const result = await seedArtistWithAuth();
    token = result.token;
    artistId = result.artistId;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app)
      .put(`/api/artists/${artistId}`)
      .send({ name: 'Sneaky Update' });
    expect(res.status).toBe(401);
  });

  it('returns 200 and the updated artist', async () => {
    const res = await request(app)
      .put(`/api/artists/${artistId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Artist Name', bio: 'Updated bio' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Artist Name');
    expect(res.body.bio).toBe('Updated bio');
    expect(res.body.id).toBe(artistId);
  });

  it('persists the update across a subsequent GET', async () => {
    await request(app)
      .put(`/api/artists/${artistId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ genre: 'Jazz' });

    const getRes = await request(app).get(`/api/artists/${artistId}`);
    expect(getRes.body.genre).toBe('Jazz');
  });

  it('returns 404 for a non-existent artist', async () => {
    const res = await request(app)
      .put('/api/artists/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ghost' });
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/artists/:id ──────────────────────────────────────────────────

describe('DELETE /api/artists/:id', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const { artistId } = await seedArtistWithAuth();
    const res = await request(app).delete(`/api/artists/${artistId}`);
    expect(res.status).toBe(401);
  });

  it('returns 204 on successful deletion', async () => {
    const { token, artistId } = await seedArtistWithAuth();
    const res = await request(app)
      .delete(`/api/artists/${artistId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 when fetching a deleted artist', async () => {
    const { token, artistId } = await seedArtistWithAuth();
    await request(app)
      .delete(`/api/artists/${artistId}`)
      .set('Authorization', `Bearer ${token}`);

    const getRes = await request(app).get(`/api/artists/${artistId}`);
    expect(getRes.status).toBe(404);
  });

  it('returns 404 when deleting a non-existent artist', async () => {
    const { user, plainPassword } = await createTestUser();
    const token = await getAuthToken(app, user.email, plainPassword);

    const res = await request(app)
      .delete('/api/artists/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

// ─── POST /api/artists/:id/embeddings ─────────────────────────────────────────

describe('POST /api/artists/:id/embeddings', () => {
  let token: string;
  let artistId: string;

  beforeAll(async () => {
    const result = await seedArtistWithAuth();
    token = result.token;
    artistId = result.artistId;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app)
      .post(`/api/artists/${artistId}/embeddings`)
      .send({ embedCode: SPOTIFY_EMBED });
    expect(res.status).toBe(401);
  });

  it('returns 400 when embedCode is missing', async () => {
    const res = await request(app)
      .post(`/api/artists/${artistId}/embeddings`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/embed code is required/i);
  });

  it('returns 400 for an invalid (unsupported platform) embed code', async () => {
    const res = await request(app)
      .post(`/api/artists/${artistId}/embeddings`)
      .set('Authorization', `Bearer ${token}`)
      .send({ embedCode: '<iframe src="https://player.vimeo.com/video/123"></iframe>' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/unsupported platform/i);
  });

  it('returns 400 for a javascript: XSS embed code', async () => {
    const res = await request(app)
      .post(`/api/artists/${artistId}/embeddings`)
      .set('Authorization', `Bearer ${token}`)
      .send({ embedCode: '<iframe src="javascript:alert(1)"></iframe>' });
    expect(res.status).toBe(400);
  });

  it('returns 404 when the artist does not exist', async () => {
    const res = await request(app)
      .post('/api/artists/00000000-0000-0000-0000-000000000000/embeddings')
      .set('Authorization', `Bearer ${token}`)
      .send({ embedCode: SPOTIFY_EMBED });
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/artist not found/i);
  });

  it('returns 201 and the new embedding for a valid Spotify embed', async () => {
    const res = await request(app)
      .post(`/api/artists/${artistId}/embeddings`)
      .set('Authorization', `Bearer ${token}`)
      .send({ embedCode: SPOTIFY_EMBED });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('embedding');
    expect(res.body.embedding.platform).toBe('spotify');
    expect(res.body.embedding).toHaveProperty('id');
  });

  it('returns 201 for a valid YouTube embed', async () => {
    const res = await request(app)
      .post(`/api/artists/${artistId}/embeddings`)
      .set('Authorization', `Bearer ${token}`)
      .send({ embedCode: YOUTUBE_EMBED });

    expect(res.status).toBe(201);
    expect(res.body.embedding.platform).toBe('youtube');
  });

  it('embedding is persisted and visible on GET /api/artists/:id', async () => {
    await request(app)
      .post(`/api/artists/${artistId}/embeddings`)
      .set('Authorization', `Bearer ${token}`)
      .send({ embedCode: SPOTIFY_EMBED });

    const getRes = await request(app).get(`/api/artists/${artistId}`);
    const embeddings: any[] = getRes.body.embeddings ?? [];
    const spotifyEmbeddings = embeddings.filter((e: any) => e.platform === 'spotify');
    expect(spotifyEmbeddings.length).toBeGreaterThan(0);
  });
});

// ─── PUT /api/artists/:id/embeddings/:embeddingId ─────────────────────────────

describe('PUT /api/artists/:id/embeddings/:embeddingId', () => {
  let token: string;
  let artistId: string;
  let embeddingId: string;

  beforeAll(async () => {
    const result = await seedArtistWithAuth();
    token = result.token;
    artistId = result.artistId;

    // Add an embedding to update
    const embedRes = await request(app)
      .post(`/api/artists/${artistId}/embeddings`)
      .set('Authorization', `Bearer ${token}`)
      .send({ embedCode: SPOTIFY_EMBED });
    embeddingId = embedRes.body.embedding.id;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app)
      .put(`/api/artists/${artistId}/embeddings/${embeddingId}`)
      .send({ embedCode: YOUTUBE_EMBED });
    expect(res.status).toBe(401);
  });

  it('returns 400 when embedCode is missing', async () => {
    const res = await request(app)
      .put(`/api/artists/${artistId}/embeddings/${embeddingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/embed code is required/i);
  });

  it('returns 400 for an invalid embed code', async () => {
    const res = await request(app)
      .put(`/api/artists/${artistId}/embeddings/${embeddingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ embedCode: '<iframe src="https://player.vimeo.com/video/999"></iframe>' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent embedding ID', async () => {
    const res = await request(app)
      .put(`/api/artists/${artistId}/embeddings/embed_nonexistent_id`)
      .set('Authorization', `Bearer ${token}`)
      .send({ embedCode: YOUTUBE_EMBED });
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/embedding not found/i);
  });

  it('returns 404 for a non-existent artist', async () => {
    const res = await request(app)
      .put(`/api/artists/00000000-0000-0000-0000-000000000000/embeddings/${embeddingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ embedCode: YOUTUBE_EMBED });
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/artist not found/i);
  });

  it('returns 200 and the updated embedding when replacing with a YouTube embed', async () => {
    const res = await request(app)
      .put(`/api/artists/${artistId}/embeddings/${embeddingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ embedCode: YOUTUBE_EMBED });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('embedding');
    expect(res.body.embedding.platform).toBe('youtube');
    expect(res.body.embedding.id).toBe(embeddingId);
  });
});

// ─── DELETE /api/artists/:id/embeddings/:embeddingId ─────────────────────────

describe('DELETE /api/artists/:id/embeddings/:embeddingId', () => {
  let token: string;
  let artistId: string;

  beforeAll(async () => {
    const result = await seedArtistWithAuth();
    token = result.token;
    artistId = result.artistId;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  async function addEmbedding(embedCode = SPOTIFY_EMBED) {
    const res = await request(app)
      .post(`/api/artists/${artistId}/embeddings`)
      .set('Authorization', `Bearer ${token}`)
      .send({ embedCode });
    return res.body.embedding.id as string;
  }

  it('returns 401 without an auth token', async () => {
    const embeddingId = await addEmbedding();
    const res = await request(app)
      .delete(`/api/artists/${artistId}/embeddings/${embeddingId}`);
    expect(res.status).toBe(401);
  });

  it('returns 404 for a non-existent embedding', async () => {
    const res = await request(app)
      .delete(`/api/artists/${artistId}/embeddings/embed_nonexistent`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/embedding not found/i);
  });

  it('returns 404 for a non-existent artist', async () => {
    const res = await request(app)
      .delete('/api/artists/00000000-0000-0000-0000-000000000000/embeddings/some-id')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/artist not found/i);
  });

  it('returns 200 on successful deletion', async () => {
    const embeddingId = await addEmbedding();
    const res = await request(app)
      .delete(`/api/artists/${artistId}/embeddings/${embeddingId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted successfully/i);
  });

  it('embedding is absent from the artist after deletion', async () => {
    const embeddingId = await addEmbedding(YOUTUBE_EMBED);

    await request(app)
      .delete(`/api/artists/${artistId}/embeddings/${embeddingId}`)
      .set('Authorization', `Bearer ${token}`);

    const getRes = await request(app).get(`/api/artists/${artistId}`);
    const ids = (getRes.body.embeddings ?? []).map((e: any) => e.id);
    expect(ids).not.toContain(embeddingId);
  });
});
