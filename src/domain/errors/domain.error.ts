import { HttpStatus, ErrorCode } from '@shared/contracts/api-response';

export abstract class DomainError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends DomainError {
  public readonly statusCode = HttpStatus.BAD_REQUEST;
  public readonly code = ErrorCode.VALIDATION_ERROR;
}

export class EntityNotFoundError extends DomainError {
  public readonly statusCode = HttpStatus.NOT_FOUND;
  public readonly code = ErrorCode.RESOURCE_NOT_FOUND;

  constructor(entityName: string, identifier: string | number) {
    super(`${entityName} with identifier '${identifier}' was not found.`);
  }
}

export class ConflictError extends DomainError {
  public readonly statusCode = HttpStatus.CONFLICT;
  public readonly code = ErrorCode.CONFLICT;
}

export class UnauthorizedError extends DomainError {
  public readonly statusCode = HttpStatus.UNAUTHORIZED;
  public readonly code = ErrorCode.UNAUTHORIZED;

  constructor(message = 'Authentication required or invalid credentials provided.') {
    super(message);
  }
}

export class ForbiddenError extends DomainError {
  public readonly statusCode = HttpStatus.FORBIDDEN;
  public readonly code = ErrorCode.FORBIDDEN;

  constructor(message = 'You do not have permission to perform this action.') {
    super(message);
  }
}

export class RateLimitExceededError extends DomainError {
  public readonly statusCode = HttpStatus.TOO_MANY_REQUESTS;
  public readonly code = ErrorCode.RATE_LIMIT_EXCEEDED;

  constructor(message = 'Rate limit quota exceeded. Please retry after some time.') {
    super(message);
  }
}

export class CircuitBreakerOpenError extends DomainError {
  public readonly statusCode = HttpStatus.SERVICE_UNAVAILABLE;
  public readonly code = ErrorCode.CIRCUIT_BREAKER_OPEN;

  constructor(endpoint: string) {
    super(`Circuit breaker is open for endpoint: ${endpoint}. Delivery temporarily halted.`);
  }
}

export class DatabaseConnectionError extends DomainError {
  public readonly statusCode = HttpStatus.SERVICE_UNAVAILABLE;
  public readonly code = ErrorCode.DATABASE_ERROR;

  constructor(dbName: string, originalMessage?: string) {
    super(
      `Failed to connect to ${dbName} database.${originalMessage ? ` Details: ${originalMessage}` : ''}`,
    );
  }
}

export class InternalDomainError extends DomainError {
  public readonly statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  public readonly code = ErrorCode.INTERNAL_SERVER_ERROR;
}
