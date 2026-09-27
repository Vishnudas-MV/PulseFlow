import { Pool, PoolClient, QueryResult } from 'pg';
import { env } from '@shared/utils/env';
import { logger } from '@infrastructure/logging/logger';
import { IDatabaseHealthCheckable } from '@application/use-cases/get-health.use-case';

export class PostgresClient implements IDatabaseHealthCheckable {
  private static instance: PostgresClient;
  private readonly pool: Pool;

  private constructor() {
    this.pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: env.POSTGRES_MAX_POOL_SIZE,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.pool.on('error', err => {
      logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
    });
  }

  public static getInstance(): PostgresClient {
    if (!PostgresClient.instance) {
      PostgresClient.instance = new PostgresClient();
    }
    return PostgresClient.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async query<R extends object = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<R>> {
    return this.pool.query<R>(text, params);
  }

  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  public async healthCheck(): Promise<{ isHealthy: boolean; latencyMs: number; error?: string }> {
    const start = performance.now();
    try {
      await this.pool.query('SELECT 1');
      const latencyMs = Math.round(performance.now() - start);
      return { isHealthy: true, latencyMs };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - start);
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { isHealthy: false, latencyMs, error: errorMessage };
    }
  }

  public async close(): Promise<void> {
    logger.info('Closing PostgreSQL connection pool...');
    await this.pool.end();
    logger.info('PostgreSQL connection pool closed.');
  }
}

export const postgresClient = PostgresClient.getInstance();
