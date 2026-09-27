import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '@infrastructure/http/app';

describe('Health and System Routes', () => {
  const app = createApp();

  it('GET /health/liveness should return alive status', async () => {
    const res = await request(app).get('/health/liveness');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('alive');
    expect(res.body.meta.traceId).toBeDefined();
  });

  it('GET /api/v1/system/info should return system metadata', async () => {
    const res = await request(app).get('/api/v1/system/info');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('service', 'pulseflow-api');
    expect(res.body.data).toHaveProperty('version', '0.1.0');
    expect(res.body.data).toHaveProperty('nodeVersion');
    expect(res.body.data).toHaveProperty('uptimeSeconds');
    expect(res.body.data).toHaveProperty('memory');
  });

  it('GET /health/readiness should report dependency status structure', async () => {
    const res = await request(app).get('/health/readiness');

    // In local test environment without docker containers running, readiness reports degraded or unhealthy
    expect([200, 503]).toContain(res.status);
    expect(res.body.data).toHaveProperty('dependencies');
    expect(res.body.data.dependencies).toHaveProperty('postgres');
    expect(res.body.data.dependencies).toHaveProperty('mongo');
    expect(res.body.data.dependencies).toHaveProperty('redis');
  });
});
