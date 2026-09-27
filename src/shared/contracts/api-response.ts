/**
 * PulseFlow Enterprise API Response Contracts
 * Strictly typed API Envelope specifications for standard success and error responses.
 */

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CIRCUIT_BREAKER_OPEN = 'CIRCUIT_BREAKER_OPEN',
  BAD_REQUEST = 'BAD_REQUEST',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export interface ApiMeta {
  traceId: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
  [key: string]: unknown;
}

export interface ApiErrorInfo {
  code: string;
  message: string;
  details?: ApiErrorDetail[] | unknown;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: ApiErrorInfo;
  meta: ApiMeta;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiResponseBuilder {
  /**
   * Generates a compliant success envelope.
   */
  public static success<T>(
    data: T,
    statusCode = HttpStatus.OK,
    traceId = 'system',
    customMeta?: Record<string, unknown>,
  ): ApiSuccessResponse<T> {
    return {
      success: true,
      statusCode,
      data,
      meta: {
        traceId,
        timestamp: new Date().toISOString(),
        ...customMeta,
      },
    };
  }

  /**
   * Generates a compliant error envelope.
   */
  public static error(
    code: string,
    message: string,
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: ApiErrorDetail[] | unknown,
    traceId = 'system',
    customMeta?: Record<string, unknown>,
  ): ApiErrorResponse {
    return {
      success: false,
      statusCode,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
      meta: {
        traceId,
        timestamp: new Date().toISOString(),
        ...customMeta,
      },
    };
  }
}
