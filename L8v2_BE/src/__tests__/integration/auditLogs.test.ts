import request from 'supertest';
import { AppDataSource } from '../../config/database';
import { AuditLog } from '../../models/AuditLog';
import { createTestApp, createTestUser, getAuthToken, cleanupDatabase } from '../helpers';

const app = createTestApp();

async function insertAuditLog(overrides: Partial<AuditLog> = {}): Promise<AuditLog> {
  const repo = AppDataSource.getRepository(AuditLog);
  const log = repo.create({
    action: 'INSERT',
    entityType: 'artist',
    entityId: '00000000-0000-0000-0000-000000000001',
    newValues: { name: 'Test Artist' },
    ...overrides,
  });
  return repo.save(log);
}

// ─── Authentication — EQ ──────────────────────────────────────────────────────

describe('GET /api/audit-logs — authentication (EQ)', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app).get('/api/audit-logs');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a malformed token', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', 'Bearer not.a.valid.jwt');
    expect(res.status).toBe(401);
  });

  it('returns 200 with a valid token', async () => {
    const { user, plainPassword } = await createTestUser();
    const token = await getAuthToken(app, user.email, plainPassword);

    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

// ─── Response shape — EQ ──────────────────────────────────────────────────────

describe('GET /api/audit-logs — response shape (EQ)', () => {
  let token: string;

  beforeAll(async () => {
    const { user, plainPassword } = await createTestUser();
    token = await getAuthToken(app, user.email, plainPassword);
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns a paginated envelope with data, total, page, limit, and totalPages', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
    expect(res.body).toHaveProperty('totalPages');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('defaults to page 1 and limit 20', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(20);
  });
});

// ─── Pagination — BVA ─────────────────────────────────────────────────────────

describe('GET /api/audit-logs — pagination query params (BVA)', () => {
  let token: string;

  beforeAll(async () => {
    const { user, plainPassword } = await createTestUser();
    token = await getAuthToken(app, user.email, plainPassword);
    await Promise.all(Array.from({ length: 25 }, (_, i) =>
      insertAuditLog({ entityId: `entity-${i}` })
    ));
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('returns limit=1 when limit=1 (BVA: lower boundary)', async () => {
    const res = await request(app)
      .get('/api/audit-logs?limit=1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.limit).toBe(1);
    expect(res.body.data.length).toBe(1);
  });

  it('returns limit=100 when limit=100 (BVA: upper boundary)', async () => {
    const res = await request(app)
      .get('/api/audit-logs?limit=100')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.limit).toBe(100);
  });

  it('clamps limit to 100 when limit=101 (BVA: one above upper boundary)', async () => {
    const res = await request(app)
      .get('/api/audit-logs?limit=101')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.limit).toBe(100);
  });

  it('falls back to default limit=20 when limit=0 (BVA: 0 is falsy, so || 20 applies)', async () => {
    const res = await request(app)
      .get('/api/audit-logs?limit=0')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.limit).toBe(20);
  });

  it('clamps page to 1 when page=0 (BVA: one below lower boundary)', async () => {
    const res = await request(app)
      .get('/api/audit-logs?page=0')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.page).toBe(1);
  });

  it('returns page=1 when page=1 (BVA: lower boundary)', async () => {
    const res = await request(app)
      .get('/api/audit-logs?page=1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.page).toBe(1);
  });
});

// ─── Filtering — EQ ───────────────────────────────────────────────────────────

describe('GET /api/audit-logs — filters (EQ)', () => {
  let token: string;

  beforeAll(async () => {
    const { user, plainPassword } = await createTestUser();
    token = await getAuthToken(app, user.email, plainPassword);
    await insertAuditLog({ action: 'INSERT', entityType: 'artist' });
    await insertAuditLog({ action: 'UPDATE', entityType: 'user' });
    await insertAuditLog({ action: 'DELETE', entityType: 'event' });
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('filters by table (entityType)', async () => {
    const res = await request(app)
      .get('/api/audit-logs?table=artist')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((row: { entityType: string }) => row.entityType === 'artist')).toBe(true);
  });

  it('filters by action (case-insensitive: lowercase input is uppercased)', async () => {
    const res = await request(app)
      .get('/api/audit-logs?action=insert')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((row: { action: string }) => row.action === 'INSERT')).toBe(true);
  });

  it('returns empty data for a non-existent table filter', async () => {
    const res = await request(app)
      .get('/api/audit-logs?table=nonexistent')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });
});

// ─── Sensitive field redaction — EQ ───────────────────────────────────────────

describe('GET /api/audit-logs — sensitive field redaction (EQ)', () => {
  let token: string;

  beforeAll(async () => {
    const { user, plainPassword } = await createTestUser();
    token = await getAuthToken(app, user.email, plainPassword);

    await insertAuditLog({
      action: 'INSERT',
      entityType: 'user',
      newValues: { id: 'some-uuid', email: 'u@example.com', password: 'plaintext123' },
      oldValues: { id: 'some-uuid', email: 'old@example.com', password: 'oldplain' },
    });
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('redacts the password field in newValues for user entity logs', async () => {
    const res = await request(app)
      .get('/api/audit-logs?table=user')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const row = res.body.data[0];
    expect(row.newValues.password).toBe('[REDACTED]');
  });

  it('redacts the password field in oldValues for user entity logs', async () => {
    const res = await request(app)
      .get('/api/audit-logs?table=user')
      .set('Authorization', `Bearer ${token}`);

    const row = res.body.data[0];
    expect(row.oldValues.password).toBe('[REDACTED]');
  });

  it('does not redact non-sensitive fields in user entity logs', async () => {
    const res = await request(app)
      .get('/api/audit-logs?table=user')
      .set('Authorization', `Bearer ${token}`);

    const row = res.body.data[0];
    expect(row.newValues.email).toBe('u@example.com');
  });

  it('does not redact any fields for non-user entity logs', async () => {
    await insertAuditLog({
      action: 'INSERT',
      entityType: 'artist',
      newValues: { name: 'An Artist', password: 'should-not-be-redacted' },
    });

    const res = await request(app)
      .get('/api/audit-logs?table=artist')
      .set('Authorization', `Bearer ${token}`);

    const row = res.body.data.find(
      (r: { newValues: { name: string } }) => r.newValues?.name === 'An Artist'
    );
    expect(row.newValues.password).toBe('should-not-be-redacted');
  });
});
