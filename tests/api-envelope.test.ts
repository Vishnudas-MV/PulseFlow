import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { Router } from 'express';
import { createApp } from '@infrastructure/http/app';
import { ValidationError, EntityNotFoundError } from '@domain/errors/domain.error';
import { asyncHandler } from '@shared/utils/async-handler';

describe('Standardized API Envelope & Error Handling', () => {
  const testRouter = Router();

  testRouter.get(
    '/test-domain-error',
    asyncHandler(async () => {
      throw new ValidationError('Validation failed for test entity', [
        { field: 'targetUrl', message: 'Must be HTTPS' },
      ]);
    }),
  );

  testRouter.get(
    '/test-not-found-error',
    asyncHandler(async () => {
      throw new EntityNotFoundError('Endpoint', 'ep_12345');
    }),
  );

  testRouter.get(
    '/test-unhandled-error',
    asyncHandler(async () => {
      throw new Error('Unexpected crash in worker');
    }),
  );

  const app = createApp(testRouter);

  it('should return a standard success envelope on valid requests', async () => {
    const res = await request(app).get('/health/liveness');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('statusCode', 200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toEqual(
      expect.objectContaining({
        status: 'alive',
      }),
    );
    expect(res.body).toHaveProperty('meta');
    expect(res.body.meta).toHaveProperty('traceId');
    expect(res.body.meta).toHaveProperty('timestamp');
    expect(typeof res.body.meta.traceId).toBe('string');
    expect(res.headers['x-trace-id']).toBe(res.body.meta.traceId);
  });

  it('should format DomainError into standard error envelope with correct status code', async () => {
    const res = await request(app).get('/test-domain-error');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      statusCode: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed for test entity',
        details: [{ field: 'targetUrl', message: 'Must be HTTPS' }],
      },
      meta: {
        traceId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });

  it('should format EntityNotFoundError with 404 and RESOURCE_NOT_FOUND', async () => {
    const res = await request(app).get('/test-not-found-error');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(404);
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    expect(res.body.error.message).toContain('ep_12345');
    expect(res.body.meta.traceId).toBeDefined();
  });

  it('should format 404 routes into standardized error envelope', async () => {
    const res = await request(app).get('/non-existent-endpoint-route');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(404);
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    expect(res.body.error.message).toContain('/non-existent-endpoint-route');
    expect(res.body.meta.traceId).toBeDefined();
  });

  it('should handle unhandled internal server errors safely', async () => {
    const res = await request(app).get('/test-unhandled-error');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(res.body.meta.traceId).toBeDefined();
  });
});
