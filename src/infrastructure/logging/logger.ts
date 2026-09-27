import pino, { Logger, LoggerOptions } from 'pino';
import { env } from '@shared/utils/env';
import { AsyncContext } from './async-context';

const redactPaths = [
  'req.headers.authorization',
  'req.headers["x-api-key"]',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  'req.headers["proxy-authorization"]',
  'headers.authorization',
  'headers["x-api-key"]',
  'headers.cookie',
  '*.password',
  '*.secret',
  '*.secretKey',
  '*.token',
  '*.accessToken',
  '*.apiKey',
];

const pinoOptions: LoggerOptions = {
  level: env.LOG_LEVEL,
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: label => ({ level: label.toUpperCase() }),
  },
  mixin: () => {
    const context = AsyncContext.get();
    if (context) {
      return {
        traceId: context.traceId,
        ...(context.tenantId ? { tenantId: context.tenantId } : {}),
        ...(context.correlationId ? { correlationId: context.correlationId } : {}),
      };
    }
    return {};
  },
};

const createLogger = (): Logger => {
  if (env.NODE_ENV === 'development' && env.LOG_PRETTY) {
    return pino({
      ...pinoOptions,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss.l',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      },
    });
  }

  return pino(pinoOptions);
};

export const logger: Logger = createLogger();
