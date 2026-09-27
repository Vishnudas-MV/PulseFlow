import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { Router } from 'express';
import { createApp } from '@infrastructure/http/app';
import { AsyncContext } from '@infrastructure/logging/async-context';
import { asyncHandler } from '@shared/utils/async-handler';
import { ApiResponseBuilder } from '@shared/contracts/api-response';

describe('Trace Middleware & Correlation Context', () => {
  const testRouter = Router();

  testRouter.get(
    '/test-trace-propagation',
    asyncHandler(async (req, res) => {
      // AsyncContext.getTraceId() should match req.traceId
      const contextTraceId = AsyncContext.getTraceId();
      res.json(
        ApiResponseBuilder.success(
          {
            requestTraceId: req.traceId,
            contextTraceId,
          },
          200,
          req.traceId,
        ),
      );
    }),
  );

  const app = createApp(testRouter);

  it('should generate a new UUID trace ID when none is provided in headers', async () => {
    const res = await request(app).get('/test-trace-propagation');

    expect(res.status).toBe(200);
    const traceHeader = res.headers['x-trace-id'];
    expect(traceHeader).toBeDefined();
    expect(traceHeader).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(res.body.data.requestTraceId).toBe(traceHeader);
    expect(res.body.data.contextTraceId).toBe(traceHeader);
    expect(res.body.meta.traceId).toBe(traceHeader);
  });

  it('should propagate incoming x-trace-id header in response and context', async () => {
    const customTraceId = 'pulse-trace-custom-987654321';
    const res = await request(app)
      .get('/test-trace-propagation')
      .set('x-trace-id', customTraceId);

    expect(res.status).toBe(200);
    expect(res.headers['x-trace-id']).toBe(customTraceId);
    expect(res.body.data.requestTraceId).toBe(customTraceId);
    expect(res.body.data.contextTraceId).toBe(customTraceId);
    expect(res.body.meta.traceId).toBe(customTraceId);
  });

  it('should accept x-correlation-id fallback when x-trace-id is not provided', async () => {
    const customCorrelationId = 'corr-abc-123';
    const res = await request(app)
      .get('/test-trace-propagation')
      .set('x-correlation-id', customCorrelationId);

    expect(res.status).toBe(200);
    expect(res.headers['x-trace-id']).toBe(customCorrelationId);
    expect(res.body.meta.traceId).toBe(customCorrelationId);
  });
});
