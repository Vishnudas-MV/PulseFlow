import { v4 as uuidv4 } from 'uuid';
import { IngestEventDto, IngestEventResponseDto } from '../dtos/ingest-event.dto';
import { IEventRepository } from '@domain/repositories/event.repository.interface';
import { ICacheService } from '@domain/repositories/cache.service.interface';
import { WebhookEvent, EventStatus } from '@domain/entities/webhook-event.entity';
import { ConflictError } from '@domain/errors/domain.error';

export class IngestEventUseCase {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly cacheService: ICacheService,
  ) {}

  public async execute(dto: IngestEventDto): Promise<IngestEventResponseDto> {
    const idempotencyCacheKey = `idempotency:${dto.tenantId}:${dto.idempotencyKey}`;

    // 1. Guard against duplicate ingestion via atomic Redis SETNX
    const isNew = await this.cacheService.setNX(idempotencyCacheKey, 'LOCKED', 86400);
    if (!isNew) {
      const existing = await this.eventRepository.findByIdempotencyKey(
        dto.idempotencyKey,
        dto.tenantId,
      );
      if (existing) {
        return {
          eventId: existing.id,
          idempotencyKey: existing.idempotencyKey,
          status: existing.status,
          queuedAt: existing.createdAt.toISOString(),
        };
      }
      throw new ConflictError(
        `Duplicate event ingestion in progress for idempotency key: ${dto.idempotencyKey}`,
      );
    }

    // 2. Instantiate domain entity
    const event = new WebhookEvent({
      id: uuidv4(),
      tenantId: dto.tenantId,
      destinationEndpointId: dto.destinationEndpointId,
      eventType: dto.eventType,
      payload: dto.payload,
      headers: dto.headers,
      idempotencyKey: dto.idempotencyKey,
      status: EventStatus.QUEUED,
    });

    // 3. Persist through repository port
    await this.eventRepository.save(event);

    return {
      eventId: event.id,
      idempotencyKey: event.idempotencyKey,
      status: event.status,
      queuedAt: event.createdAt.toISOString(),
    };
  }
}
