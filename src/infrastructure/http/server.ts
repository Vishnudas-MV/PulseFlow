import http from 'http';
import { createApp } from './app';
import { env } from '@shared/utils/env';
import { logger } from '@infrastructure/logging/logger';
import { postgresClient } from '@infrastructure/database/postgres/postgres.client';
import { mongoClient } from '@infrastructure/database/mongo/mongo.client';
import { redisClient } from '@infrastructure/database/redis/redis.client';

export class HttpServer {
  private server: http.Server | null = null;
  private isShuttingDown = false;

  public async start(): Promise<http.Server> {
    const app = createApp();
    const activeServer = http.createServer(app);
    this.server = activeServer;

    // Initial connection checks (non-blocking so server can start even if DBs spin up in parallel)
    this.verifyDependencies();

    return new Promise(resolve => {
      activeServer.listen(env.PORT, env.HOST, () => {
        logger.info(
          {
            service: env.SERVICE_NAME,
            environment: env.NODE_ENV,
            host: env.HOST,
            port: env.PORT,
            apiPrefix: env.API_PREFIX,
          },
          `🚀 PulseFlow API Server running at http://${env.HOST}:${env.PORT}${env.API_PREFIX}`,
        );
        this.setupShutdownSignals();
        resolve(activeServer);
      });
    });
  }

  private async verifyDependencies(): Promise<void> {
    logger.info('Verifying database connections (Postgres, Mongo, Redis)...');
    try {
      const [pgCheck, mongoCheck, redisCheck] = await Promise.allSettled([
        postgresClient.healthCheck(),
        mongoClient.healthCheck(),
        redisClient.healthCheck(),
      ]);

      if (pgCheck.status === 'fulfilled' && pgCheck.value.isHealthy) {
        logger.info({ latencyMs: pgCheck.value.latencyMs }, '✅ PostgreSQL connection verified');
      } else {
        const error = pgCheck.status === 'fulfilled' ? pgCheck.value.error : String(pgCheck.reason);
        logger.warn({ error }, '⚠️ PostgreSQL connection pending/failed');
      }

      if (mongoCheck.status === 'fulfilled' && mongoCheck.value.isHealthy) {
        logger.info({ latencyMs: mongoCheck.value.latencyMs }, '✅ MongoDB connection verified');
      } else {
        const error =
          mongoCheck.status === 'fulfilled' ? mongoCheck.value.error : String(mongoCheck.reason);
        logger.warn({ error }, '⚠️ MongoDB connection pending/failed');
      }

      if (redisCheck.status === 'fulfilled' && redisCheck.value.isHealthy) {
        logger.info({ latencyMs: redisCheck.value.latencyMs }, '✅ Redis connection verified');
      } else {
        const error =
          redisCheck.status === 'fulfilled' ? redisCheck.value.error : String(redisCheck.reason);
        logger.warn({ error }, '⚠️ Redis connection pending/failed');
      }
    } catch (err) {
      logger.warn({ err }, 'Dependency verification encountered non-fatal error');
    }
  }

  private setupShutdownSignals(): void {
    const shutdownHandler = async (signal: string) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      logger.info({ signal }, `Received ${signal}. Initiating graceful shutdown...`);

      const forceExitTimer = setTimeout(() => {
        logger.error('Graceful shutdown timed out (10s). Forcing termination.');
        process.exit(1);
      }, 10000);
      forceExitTimer.unref();

      try {
        // 1. Stop receiving HTTP requests
        const currentServer = this.server;
        if (currentServer) {
          await new Promise<void>((resolve, reject) => {
            currentServer.close(err => {
              if (err) return reject(err);
              logger.info('HTTP server closed successfully.');
              resolve();
            });
          });
        }

        // 2. Terminate database connections
        await Promise.allSettled([
          postgresClient.close(),
          mongoClient.close(),
          redisClient.close(),
        ]);

        logger.info('All resources terminated gracefully. Exiting process.');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error occurred during graceful shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('SIGINT', () => shutdownHandler('SIGINT'));

    process.on('unhandledRejection', reason => {
      logger.fatal({ reason }, 'Unhandled Promise Rejection detected in process');
    });

    process.on('uncaughtException', err => {
      logger.fatal({ err }, 'Uncaught Exception detected in process. Initiating shutdown...');
      shutdownHandler('uncaughtException');
    });
  }

  public async stop(): Promise<void> {
    const currentServer = this.server;
    if (currentServer) {
      await new Promise<void>((resolve, reject) => {
        currentServer.close(err => (err ? reject(err) : resolve()));
      });
      await Promise.allSettled([postgresClient.close(), mongoClient.close(), redisClient.close()]);
    }
  }
}
