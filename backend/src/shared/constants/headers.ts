/**
 * Standard HTTP Header constants used across PulseFlow services
 */

export const HTTP_HEADERS = {
  TRACE_ID: 'x-trace-id',
  CORRELATION_ID: 'x-correlation-id',
  REQUEST_ID: 'x-request-id',
  TENANT_ID: 'x-tenant-id',
  API_KEY: 'x-api-key',
  PULSEFLOW_SIGNATURE: 'x-pulseflow-signature',
  PULSEFLOW_TIMESTAMP: 'x-pulseflow-timestamp',
  IDEMPOTENCY_KEY: 'x-idempotency-key',
} as const;

export const SENSITIVE_HEADERS = new Set([
  'authorization',
  'proxy-authorization',
  'x-api-key',
  'cookie',
  'set-cookie',
  'x-pulseflow-secret',
]);
