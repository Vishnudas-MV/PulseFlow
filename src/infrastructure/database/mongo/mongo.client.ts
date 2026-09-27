import { MongoClient, Db } from 'mongodb';
import { env } from '@shared/utils/env';
import { logger } from '@infrastructure/logging/logger';
import { IDatabaseHealthCheckable } from '@application/use-cases/get-health.use-case';

export class MongoClientWrapper implements IDatabaseHealthCheckable {
  private static instance: MongoClientWrapper;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnecting = false;

  private constructor() {}

  public static getInstance(): MongoClientWrapper {
    if (!MongoClientWrapper.instance) {
      MongoClientWrapper.instance = new MongoClientWrapper();
    }
    return MongoClientWrapper.instance;
  }

  public async connect(): Promise<Db> {
    if (this.db && this.client) {
      return this.db;
    }

    if (this.isConnecting) {
      while (this.isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      if (this.db) return this.db;
    }

    this.isConnecting = true;
    try {
      this.client = new MongoClient(env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });

      await this.client.connect();
      this.db = this.client.db(env.MONGO_DB);
      logger.info('Connected successfully to MongoDB database');
      return this.db;
    } catch (err) {
      logger.error({ err }, 'Failed to establish connection to MongoDB');
      throw err;
    } finally {
      this.isConnecting = false;
    }
  }

  public getDb(): Db {
    if (!this.db) {
      throw new Error('MongoDB not initialized. Call connect() first.');
    }
    return this.db;
  }

  public async healthCheck(): Promise<{ isHealthy: boolean; latencyMs: number; error?: string }> {
    const start = performance.now();
    try {
      const database = this.db ?? (await this.connect());
      await database.command({ ping: 1 });
      const latencyMs = Math.round(performance.now() - start);
      return { isHealthy: true, latencyMs };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - start);
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { isHealthy: false, latencyMs, error: errorMessage };
    }
  }

  public async close(): Promise<void> {
    if (this.client) {
      logger.info('Closing MongoDB client connection...');
      await this.client.close();
      this.client = null;
      this.db = null;
      logger.info('MongoDB client connection closed.');
    }
  }
}

export const mongoClient = MongoClientWrapper.getInstance();
