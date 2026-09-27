import { WebhookEvent, EventStatus } from '../entities/webhook-event.entity';

export interface FindEventsFilter {
  tenantId: string;
  status?: EventStatus;
  destinationEndpointId?: string;
  limit?: number;
  offset?: number;
}

export interface IEventRepository {
  findById(id: string, tenantId: string): Promise<WebhookEvent | null>;
  findByIdempotencyKey(key: string, tenantId: string): Promise<WebhookEvent | null>;
  findMany(filter: FindEventsFilter): Promise<WebhookEvent[]>;
  save(event: WebhookEvent): Promise<void>;
  update(event: WebhookEvent): Promise<void>;
  updateStatus(id: string, status: EventStatus, details?: { lastError?: string }): Promise<void>;
}
