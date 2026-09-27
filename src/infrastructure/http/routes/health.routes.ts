import { Router, Request, Response } from 'express';
import { ApiResponseBuilder, HttpStatus } from '@shared/contracts/api-response';
import { asyncHandler } from '@shared/utils/async-handler';
import { GetHealthUseCase } from '@application/use-cases/get-health.use-case';
import { postgresClient } from '@infrastructure/database/postgres/postgres.client';
import { mongoClient } from '@infrastructure/database/mongo/mongo.client';
import { redisClient } from '@infrastructure/database/redis/redis.client';
import { env } from '@shared/utils/env';

export const createHealthRouter = (): Router => {
  const router = Router();
  const getHealthUseCase = new GetHealthUseCase(postgresClient, mongoClient, redisClient);

  /**
   * Kubernetes / ECS Liveness Probe
   */
  router.get(
    '/health/liveness',
    asyncHandler(async (req: Request, res: Response) => {
      res
        .status(HttpStatus.OK)
        .json(
          ApiResponseBuilder.success(
            { status: 'alive', timestamp: new Date().toISOString() },
            HttpStatus.OK,
            req.traceId,
          ),
        );
    }),
  );

  /**
   * Kubernetes / ECS Readiness Probe (Checks Postgres, Mongo, Redis)
   */
  router.get(
    '/health/readiness',
    asyncHandler(async (req: Request, res: Response) => {
      const result = await getHealthUseCase.execute();
      const statusCode =
        result.status === 'unhealthy' ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.OK;

      res.status(statusCode).json(ApiResponseBuilder.success(result, statusCode, req.traceId));
    }),
  );

  /**
   * Comprehensive System Telemetry & Metadata
   */
  router.get(
    '/system/info',
    asyncHandler(async (req: Request, res: Response) => {
      const mem = process.memoryUsage();
      const info = {
        service: env.SERVICE_NAME,
        version: '0.1.0',
        environment: env.NODE_ENV,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptimeSeconds: Math.floor(process.uptime()),
        memory: {
          heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
          heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
          rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(HttpStatus.OK).json(ApiResponseBuilder.success(info, HttpStatus.OK, req.traceId));
    }),
  );

  return router;
};
