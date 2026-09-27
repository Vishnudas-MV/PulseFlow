import { Request, Response, NextFunction } from 'express';
import { logger } from '@infrastructure/logging/logger';
import { SENSITIVE_HEADERS } from '@shared/constants/headers';

export const sanitizeHeaders = (
  headers: Record<string, string | string[] | undefined>,
): Record<string, string | string[] | undefined> => {
  const sanitized: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = performance.now();

  res.on('finish', () => {
    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
    const statusCode = res.statusCode;
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    const logPayload = {
      traceId: req.traceId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      headers: sanitizeHeaders(req.headers),
    };

    logger[logLevel](
      logPayload,
      `HTTP ${req.method} ${req.originalUrl || req.url} ${statusCode} - ${durationMs}ms`,
    );
  });

  next();
};
