import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AsyncContext } from '@infrastructure/logging/async-context';
import { HTTP_HEADERS } from '@shared/constants/headers';
import { logger } from '@infrastructure/logging/logger';

declare global {
  namespace Express {
    interface Request {
      traceId: string;
      correlationId?: string;
      log: typeof logger;
    }
  }
}

export const traceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incomingTraceId =
    req.headers[HTTP_HEADERS.TRACE_ID] ||
    req.headers[HTTP_HEADERS.CORRELATION_ID] ||
    req.headers[HTTP_HEADERS.REQUEST_ID];

  const traceId =
    (Array.isArray(incomingTraceId) ? incomingTraceId[0] : incomingTraceId)?.trim() || uuidv4();

  const correlationHeader = req.headers[HTTP_HEADERS.CORRELATION_ID];
  const correlationId = (
    Array.isArray(correlationHeader) ? correlationHeader[0] : correlationHeader
  )?.trim();

  // 1. Set trace ID on response header
  res.setHeader(HTTP_HEADERS.TRACE_ID, traceId);

  // 2. Attach traceId and scoped logger to request
  req.traceId = traceId;
  if (correlationId) {
    req.correlationId = correlationId;
  }
  req.log = logger.child({ traceId });

  // 3. Bind to AsyncLocalStorage context for all downstream async calls
  AsyncContext.run(
    {
      traceId,
      ...(correlationId ? { correlationId } : {}),
    },
    () => {
      next();
    },
  );
};
