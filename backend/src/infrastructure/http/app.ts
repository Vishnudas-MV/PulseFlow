import express, { Express, Router } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from '@shared/utils/env';
import { traceMiddleware } from './middleware/trace.middleware';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';
import { errorHandlerMiddleware } from './middleware/error-handler.middleware';
import { notFoundMiddleware } from './middleware/not-found.middleware';
import { createApiRouter } from './routes/api.router';
import { createHealthRouter } from './routes/health.routes';

export const createApp = (customRouter?: Router): Express => {
  const app = express();

  // 1. Security headers & hardening
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.disable('x-powered-by');

  // 2. Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'x-trace-id',
        'x-correlation-id',
        'x-request-id',
        'x-tenant-id',
        'x-api-key',
        'x-idempotency-key',
        'x-pulseflow-signature',
        'x-pulseflow-timestamp',
      ],
      exposedHeaders: ['x-trace-id', 'x-correlation-id'],
      credentials: true,
    }),
  );

  // 3. Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Trace & Correlation Context Middleware
  app.use(traceMiddleware);

  // 5. Structured HTTP Request Logging
  app.use(requestLoggerMiddleware);

  // 6. Direct root health check paths (standard for cloud load balancers / k8s)
  app.use(createHealthRouter());

  // 7. Optional custom router (useful for test routes / plugins)
  if (customRouter) {
    app.use(customRouter);
  }

  // 8. Versioned API routes (e.g. /api/v1/...)
  app.use(env.API_PREFIX, createApiRouter());

  // 9. 404 Not Found Middleware
  app.use(notFoundMiddleware);

  // 10. Global Error Handling Middleware
  app.use(errorHandlerMiddleware);

  return app;
};
