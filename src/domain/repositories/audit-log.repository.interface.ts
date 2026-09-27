import { AuditLog } from '../entities/audit-log.entity';

export interface FindAuditLogsFilter {
  tenantId: string;
  eventId?: string;
  endpointId?: string;
  limit?: number;
  offset?: number;
}

export interface IAuditLogRepository {
  record(log: AuditLog): Promise<void>;
  findMany(filter: FindAuditLogsFilter): Promise<AuditLog[]>;
  findByEventId(eventId: string, tenantId: string): Promise<AuditLog[]>;
}
