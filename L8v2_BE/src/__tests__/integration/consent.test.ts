import request from 'supertest';
import { createTestApp, cleanupDatabase } from '../helpers';
import { AppDataSource } from '../../config/database';
import { ConsentService } from '../../services/ConsentService';

const app = createTestApp();

const valid = {
  consentId: '3f1c2b1a-8d4e-4c6f-9a2b-1e2d3c4b5a69',
  version: 1,
  statistics: true,
  externalMedia: false,
};

afterEach(async () => {
  await cleanupDatabase();
});

// ─── POST /api/consent — EQ: valid decision ──────────────────────────────────

describe('POST /api/consent — valid payload', () => {
  it('returns 201 and stores the decision', async () => {
    const res = await request(app).post('/api/consent').send(valid);
    expect(res.status).toBe(201);
    expect(res.body.consentId).toBe(valid.consentId);

    const rows = await AppDataSource.query('SELECT * FROM consent_record');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      consent_id: valid.consentId,
      consent_version: 1,
      statistics: true,
      external_media: false,
    });
    expect(rows[0].created_at).toBeInstanceOf(Date);
  });

  it('does not require authentication', async () => {
    const res = await request(app).post('/api/consent').send({ ...valid, statistics: false });
    expect(res.status).toBe(201);
  });

  it('keeps every decision for the same consent id (grant then withdrawal)', async () => {
    await request(app).post('/api/consent').send(valid);
    await request(app).post('/api/consent').send({ ...valid, statistics: false });
    const rows = await AppDataSource.query(
      'SELECT statistics FROM consent_record WHERE consent_id = $1 ORDER BY created_at',
      [valid.consentId],
    );
    expect(rows.map((r: { statistics: boolean }) => r.statistics)).toEqual([true, false]);
  });
});

// ─── Data minimisation: no IP, no user-agent ─────────────────────────────────

describe('POST /api/consent — stores no IP address or user-agent', () => {
  const ip = '203.0.113.77';
  const userAgent = 'ConsentProbe/1.0 (unique-ua-marker)';

  it('has no column that could hold them', async () => {
    const cols: { column_name: string }[] = await AppDataSource.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'consent_record' ORDER BY column_name`,
    );
    expect(cols.map((c) => c.column_name)).toEqual([
      'consent_id',
      'consent_version',
      'created_at',
      'external_media',
      'id',
      'statistics',
    ]);
  });

  it('writes neither value anywhere in the stored row', async () => {
    const res = await request(app)
      .post('/api/consent')
      .set('X-Forwarded-For', ip)
      .set('User-Agent', userAgent)
      .send(valid);
    expect(res.status).toBe(201);

    const rows: { row: string }[] = await AppDataSource.query(
      'SELECT row_to_json(c)::text AS row FROM consent_record c',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].row).not.toContain(ip);
    expect(rows[0].row).not.toContain('unique-ua-marker');
  });

  it('rejects an attempt to smuggle extra fields such as an IP', async () => {
    const res = await request(app).post('/api/consent').send({ ...valid, ip });
    expect(res.status).toBe(400);
    const [{ count }] = await AppDataSource.query('SELECT count(*)::int AS count FROM consent_record');
    expect(count).toBe(0);
  });
});

// ─── POST /api/consent — EQ: invalid partitions ──────────────────────────────

describe('POST /api/consent — invalid payloads (EQ)', () => {
  const cases: [string, unknown][] = [
    ['non-UUID consentId', { ...valid, consentId: 'abc' }],
    ['missing consentId', { version: 1, statistics: true, externalMedia: true }],
    ['version 0', { ...valid, version: 0 }],
    ['fractional version', { ...valid, version: 1.5 }],
    ['string version', { ...valid, version: '1' }],
    ['non-boolean statistics', { ...valid, statistics: 'yes' }],
    ['missing externalMedia', { consentId: valid.consentId, version: 1, statistics: true }],
    ['array body', [valid]],
  ];

  it.each(cases)('returns 400 for %s', async (_label, body) => {
    const res = await request(app).post('/api/consent').send(body as object);
    expect(res.status).toBe(400);
  });
});

// ─── Retention: purge_expired_consent_records() ──────────────────────────────

describe('consent retention (24 months)', () => {
  it('deletes only records older than 24 months', async () => {
    await AppDataSource.query(
      `INSERT INTO consent_record (consent_id, consent_version, statistics, external_media, created_at) VALUES
         (gen_random_uuid(), 1, true,  true,  now() - interval '25 months'),
         (gen_random_uuid(), 1, false, false, now() - interval '23 months'),
         (gen_random_uuid(), 1, true,  false, now())`,
    );

    const deleted = await new ConsentService().purgeExpired();
    expect(deleted).toBe(1);

    const [{ oldest }] = await AppDataSource.query(
      `SELECT min(created_at) < now() - interval '24 months' AS oldest FROM consent_record`,
    );
    expect(oldest).toBe(false);
    const [{ count }] = await AppDataSource.query('SELECT count(*)::int AS count FROM consent_record');
    expect(count).toBe(2);
  });
});
