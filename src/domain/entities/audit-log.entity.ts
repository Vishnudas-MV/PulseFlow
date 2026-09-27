export interface AuditLogProps {
  id: string;
  tenantId: string;
  eventId: string;
  endpointId: string;
  attemptNumber: number;
  statusCode: number;
  responseBody?: string | null;
  latencyMs: number;
  success: boolean;
  errorMessage?: string | null;
  timestamp?: Date;
}

export class AuditLog {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly eventId: string;
  public readonly endpointId: string;
  public readonly attemptNumber: number;
  public readonly statusCode: number;
  public readonly responseBody: string | null;
  public readonly latencyMs: number;
  public readonly success: boolean;
  public readonly errorMessage: string | null;
  public readonly timestamp: Date;

  constructor(props: AuditLogProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.eventId = props.eventId;
    this.endpointId = props.endpointId;
    this.attemptNumber = props.attemptNumber;
    this.statusCode = props.statusCode;
    this.responseBody = props.responseBody ?? null;
    this.latencyMs = props.latencyMs;
    this.success = props.success;
    this.errorMessage = props.errorMessage ?? null;
    this.timestamp = props.timestamp ?? new Date();
  }
}
