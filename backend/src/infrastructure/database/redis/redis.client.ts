import Redis from 'ioredis';
import { env } from '@shared/utils/env';
import { logger } from '@infrastructure/logging/logger';
import { ICacheService } from '@domain/repositories/cache.service.interface';
import { IDatabaseHealthCheckable } from '@application/use-cases/get-health.use-case';

export class RedisClient implements ICacheService, IDatabaseHealthCheckable {
  private static instance: RedisClient;
  private readonly redis: Redis;

  private constructor() {
    this.redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: times => {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
    });

    this.redis.on('connect', () => {
      logger.info('Connecting to Redis server...');
    });

    this.redis.on('ready', () => {
      logger.info('Redis client connection established and ready');
    });

    this.redis.on('error', err => {
      logger.error({ err }, 'Redis client connection error');
    });

    this.redis.on('close', () => {
      logger.warn('Redis client connection closed');
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public getRawClient(): Redis {
    return this.redis;
  }

  public async connect(): Promise<void> {
    if (this.redis.status === 'wait') {
      await this.redis.connect();
    }
  }

  public async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.redis.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, value);
    }
  }

  public async setNX(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.redis.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  public async del(key: string): Promise<boolean> {
    const count = await this.redis.del(key);
    return count > 0;
  }

  public async ping(): Promise<string> {
    return this.redis.ping();
  }

  public async publish(channel: string, message: string): Promise<number> {
    return this.redis.publish(channel, message);
  }

  public async healthCheck(): Promise<{ isHealthy: boolean; latencyMs: number; error?: string }> {
    const start = performance.now();
    try {
      if (this.redis.status === 'wait') {
        await this.redis.connect();
      }
      const response = await this.redis.ping();
      const latencyMs = Math.round(performance.now() - start);
      return { isHealthy: response === 'PONG', latencyMs };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - start);
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { isHealthy: false, latencyMs, error: errorMessage };
    }
  }

  public async close(): Promise<void> {
    logger.info('Closing Redis connection...');
    await this.redis.quit();
    logger.info('Redis connection closed.');
  }
}

export const redisClient = RedisClient.getInstance();
