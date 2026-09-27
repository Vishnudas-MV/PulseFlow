import { z } from 'zod';

export const IngestEventSchema = z.object({
  tenantId: z.string().min(1, 'tenantId is required'),
  destinationEndpointId: z.string().min(1, 'destinationEndpointId is required'),
  eventType: z.string().min(1, 'eventType is required'),
  payload: z.record(z.unknown()),
  headers: z.record(z.string()).optional().default({}),
  idempotencyKey: z.string().min(1, 'idempotencyKey is required').max(256),
});

export type IngestEventDto = z.infer<typeof IngestEventSchema>;

export interface IngestEventResponseDto {
  eventId: string;
  idempotencyKey: string;
  status: string;
  queuedAt: string;
}
