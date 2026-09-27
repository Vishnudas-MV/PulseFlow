import { ValidationError } from '../errors/domain.error';

export enum EndpointStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CIRCUIT_OPEN = 'CIRCUIT_OPEN',
}

export interface EndpointProps {
  id: string;
  tenantId: string;
  name: string;
  targetUrl: string;
  secretKey: string;
  rateLimit?: number;
  status?: EndpointStatus;
  consecutiveFailures?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Endpoint {
  public readonly id: string;
  public readonly tenantId: string;
  public name: string;
  public targetUrl: string;
  public secretKey: string;
  public rateLimit: number;
  public status: EndpointStatus;
  public consecutiveFailures: number;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: EndpointProps) {
    this.validateUrl(props.targetUrl);

    this.id = props.id;
    this.tenantId = props.tenantId;
    this.name = props.name;
    this.targetUrl = props.targetUrl;
    this.secretKey = props.secretKey;
    this.rateLimit = props.rateLimit ?? 100;
    this.status = props.status ?? EndpointStatus.ACTIVE;
    this.consecutiveFailures = props.consecutiveFailures ?? 0;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  private validateUrl(url: string): void {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new ValidationError('Endpoint targetUrl must have an HTTP or HTTPS protocol.');
      }
    } catch {
      throw new ValidationError(`Invalid targetUrl supplied: ${url}`);
    }
  }

  public recordSuccess(): void {
    this.consecutiveFailures = 0;
    if (this.status === EndpointStatus.CIRCUIT_OPEN) {
      this.status = EndpointStatus.ACTIVE;
    }
    this.updatedAt = new Date();
  }

  public recordFailure(circuitBreakThreshold = 5): void {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= circuitBreakThreshold) {
      this.status = EndpointStatus.CIRCUIT_OPEN;
    }
    this.updatedAt = new Date();
  }

  public resetCircuit(): void {
    this.consecutiveFailures = 0;
    this.status = EndpointStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  public activate(): void {
    this.status = EndpointStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  public deactivate(): void {
    this.status = EndpointStatus.INACTIVE;
    this.updatedAt = new Date();
  }
}
