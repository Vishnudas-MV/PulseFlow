import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '@domain/errors/domain.error';
import {
  ApiResponseBuilder,
  HttpStatus,
  ErrorCode,
  ApiErrorDetail,
} from '@shared/contracts/api-response';
import { logger } from '@infrastructure/logging/logger';
import { env } from '@shared/utils/env';

export const errorHandlerMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  const traceId = req.traceId || 'unknown-trace';

  // 1. Handle Domain Errors (Business logic violations)
  if (err instanceof DomainError) {
    logger.warn(
      {
        traceId,
        code: err.code,
        statusCode: err.statusCode,
        details: err.details,
        message: err.message,
      },
      `Domain Error: ${err.message}`,
    );

    res
      .status(err.statusCode)
      .json(ApiResponseBuilder.error(err.code, err.message, err.statusCode, err.details, traceId));
    return;
  }

  // 2. Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedDetails: ApiErrorDetail[] = err.errors.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    logger.warn(
      {
        traceId,
        validationIssues: formattedDetails,
      },
      'Validation Error on incoming request payload',
    );

    res
      .status(HttpStatus.BAD_REQUEST)
      .json(
        ApiResponseBuilder.error(
          ErrorCode.VALIDATION_ERROR,
          'Request validation failed',
          HttpStatus.BAD_REQUEST,
          formattedDetails,
          traceId,
        ),
      );
    return;
  }

  // 3. Handle JSON Body Syntax Errors (from Express body-parser)
  if (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as { status?: number }).status === 400
  ) {
    logger.warn(
      {
        traceId,
        message: (err as Error).message,
      },
      'Malformed JSON syntax received in request body',
    );

    res
      .status(HttpStatus.BAD_REQUEST)
      .json(
        ApiResponseBuilder.error(
          ErrorCode.BAD_REQUEST,
          'Malformed JSON in request body',
          HttpStatus.BAD_REQUEST,
          undefined,
          traceId,
        ),
      );
    return;
  }

  // 4. Handle Unhandled Internal Exceptions
  const errorObj = err instanceof Error ? err : new Error(String(err));
  logger.error(
    {
      traceId,
      err: errorObj,
      stack: errorObj.stack,
      url: req.originalUrl,
      method: req.method,
    },
    `Unhandled Exception: ${errorObj.message}`,
  );

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred.'
      : errorObj.message;

  const details = env.NODE_ENV === 'development' ? { stack: errorObj.stack } : undefined;

  res
    .status(HttpStatus.INTERNAL_SERVER_ERROR)
    .json(
      ApiResponseBuilder.error(
        ErrorCode.INTERNAL_SERVER_ERROR,
        message,
        HttpStatus.INTERNAL_SERVER_ERROR,
        details,
        traceId,
      ),
    );
};
