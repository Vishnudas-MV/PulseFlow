import { Request, Response } from 'express';
import { ApiResponseBuilder, HttpStatus, ErrorCode } from '@shared/contracts/api-response';

export const notFoundMiddleware = (req: Request, res: Response): void => {
  const traceId = req.traceId || 'unknown-trace';
  const message = `Route '${req.method} ${req.originalUrl}' does not exist on this server.`;

  res
    .status(HttpStatus.NOT_FOUND)
    .json(
      ApiResponseBuilder.error(
        ErrorCode.RESOURCE_NOT_FOUND,
        message,
        HttpStatus.NOT_FOUND,
        undefined,
        traceId,
      ),
    );
};
