import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().default('/api/v1'),
  SERVICE_NAME: z.string().default('pulseflow-api'),

  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(1000),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z
    .string()
    .transform(val => val === 'true')
    .default('false'),

  // PostgreSQL
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_DB: z.string().default('pulseflow_db'),
  POSTGRES_USER: z.string().default('pulseflow_admin'),
  POSTGRES_PASSWORD: z.string().default('pulseflow_secret'),
  POSTGRES_MAX_POOL_SIZE: z.coerce.number().default(20),
  DATABASE_URL: z
    .string()
    .default(
      'postgresql://pulseflow_admin:pulseflow_secret@localhost:5432/pulseflow_db?schema=public',
    ),

  // MongoDB
  MONGO_HOST: z.string().default('localhost'),
  MONGO_PORT: z.coerce.number().default(27017),
  MONGO_DB: z.string().default('pulseflow_audit'),
  MONGO_USER: z.string().default('pulseflow_admin'),
  MONGO_PASSWORD: z.string().default('pulseflow_secret'),
  MONGO_URI: z
    .string()
    .default(
      'mongodb://pulseflow_admin:pulseflow_secret@localhost:27017/pulseflow_audit?authSource=admin',
    ),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().default('pulseflow_redis_secret'),
  REDIS_DB: z.coerce.number().default(0),
  REDIS_URL: z.string().default('redis://:pulseflow_redis_secret@localhost:6379/0'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errorMessages = result.error.errors
      .map(err => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    console.error('❌ Invalid or missing environment configuration:\n' + errorMessages);
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();
export type Environment = z.infer<typeof envSchema>;
