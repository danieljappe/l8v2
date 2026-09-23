import request from 'supertest';
import { createTestApp } from '../helpers';
import { AppDataSource } from '../../config/database';

const app = createTestApp();

describe('GET /api/health — liveness', () => {
  it('returns 200 with a minimal body', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('is not cacheable', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('does not require authentication', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('stays 200 even when the database is unreachable', async () => {
    // Liveness must not depend on the database: a supervisor restarting this
    // process would not fix a database outage.
    const spy = jest.spyOn(AppDataSource, 'query').mockRejectedValue(new Error('connection refused'));
    try {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('GET /api/health/ready — readiness', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 200 and reports the database as ok when it answers', async () => {
    const res = await request(app).get('/api/health/ready');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', checks: { database: 'ok' } });
  });

  it('is not cacheable', async () => {
    const res = await request(app).get('/api/health/ready');
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('returns 503 when the database query fails', async () => {
    jest.spyOn(AppDataSource, 'query').mockRejectedValue(new Error('connection refused'));

    const res = await request(app).get('/api/health/ready');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'unhealthy', checks: { database: 'down' } });
  });

  it('returns 503 rather than hanging when the database stops responding', async () => {
    // A hanging database is the case the probe timeout exists for: without it
    // the request would block until the caller gave up.
    jest.spyOn(AppDataSource, 'query').mockImplementation(
      () => new Promise(() => { /* never settles */ })
    );

    const started = Date.now();
    const res = await request(app).get('/api/health/ready');
    const elapsed = Date.now() - started;

    expect(res.status).toBe(503);
    expect(res.body.checks.database).toBe('down');
    expect(elapsed).toBeLessThan(5000);
  }, 10000);

  it('does not leak error details about the failure', async () => {
    jest.spyOn(AppDataSource, 'query').mockRejectedValue(
      new Error('password authentication failed for user "postgres"')
    );

    const res = await request(app).get('/api/health/ready');
    expect(JSON.stringify(res.body)).not.toMatch(/password|postgres|authentication/i);
  });
});
