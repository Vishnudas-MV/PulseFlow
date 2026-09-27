export enum EventStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  DEAD_LETTER = 'DEAD_LETTER',
}

export interface WebhookEventProps {
  id: string;
  tenantId: string;
  destinationEndpointId: string;
  eventType: string;
  payload: Record<string, unknown>;
  headers?: Record<string, string>;
  idempotencyKey: string;
  status?: EventStatus;
  retryCount?: number;
  maxRetries?: number;
  nextRetryAt?: Date | null;
  deliveredAt?: Date | null;
  lastError?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class WebhookEvent {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly destinationEndpointId: string;
  public readonly eventType: string;
  public readonly payload: Record<string, unknown>;
  public readonly headers: Record<string, string>;
  public readonly idempotencyKey: string;
  public status: EventStatus;
  public retryCount: number;
  public readonly maxRetries: number;
  public nextRetryAt: Date | null;
  public deliveredAt: Date | null;
  public lastError: string | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: WebhookEventProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.destinationEndpointId = props.destinationEndpointId;
    this.eventType = props.eventType;
    this.payload = props.payload;
    this.headers = props.headers ?? {};
    this.idempotencyKey = props.idempotencyKey;
    this.status = props.status ?? EventStatus.PENDING;
    this.retryCount = props.retryCount ?? 0;
    this.maxRetries = props.maxRetries ?? 5;
    this.nextRetryAt = props.nextRetryAt ?? null;
    this.deliveredAt = props.deliveredAt ?? null;
    this.lastError = props.lastError ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  public markQueued(): void {
    this.status = EventStatus.QUEUED;
    this.updatedAt = new Date();
  }

  public markProcessing(): void {
    this.status = EventStatus.PROCESSING;
    this.updatedAt = new Date();
  }

  public markDelivered(): void {
    this.status = EventStatus.DELIVERED;
    this.deliveredAt = new Date();
    this.nextRetryAt = null;
    this.updatedAt = new Date();
  }

  public canRetry(): boolean {
    return this.retryCount < this.maxRetries;
  }

  public recordFailure(reason: string, backoffMs = 1000): void {
    this.retryCount += 1;
    this.lastError = reason;
    this.updatedAt = new Date();

    if (this.canRetry()) {
      this.status = EventStatus.FAILED;
      this.nextRetryAt = new Date(Date.now() + backoffMs);
    } else {
      this.moveToDeadLetter(reason);
    }
  }

  public moveToDeadLetter(reason: string): void {
    this.status = EventStatus.DEAD_LETTER;
    this.lastError = `Max retries (${this.maxRetries}) exceeded. Reason: ${reason}`;
    this.nextRetryAt = null;
    this.updatedAt = new Date();
  }
}
