export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface DependencyHealth {
  status: 'up' | 'down';
  latencyMs: number;
  message?: string;
}

export interface HealthCheckResultDto {
  status: HealthStatus;
  service: string;
  version: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
  };
  dependencies: {
    postgres: DependencyHealth;
    mongo: DependencyHealth;
    redis: DependencyHealth;
  };
}
