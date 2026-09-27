import { HealthCheckResultDto, DependencyHealth, HealthStatus } from '../dtos/health.dto';
import { env } from '@shared/utils/env';

export interface IDatabaseHealthCheckable {
  healthCheck(): Promise<{ isHealthy: boolean; latencyMs: number; error?: string }>;
}

export class GetHealthUseCase {
  constructor(
    private readonly postgresClient: IDatabaseHealthCheckable,
    private readonly mongoClient: IDatabaseHealthCheckable,
    private readonly redisClient: IDatabaseHealthCheckable,
  ) {}

  public async execute(): Promise<HealthCheckResultDto> {
    const [pgResult, mongoResult, redisResult] = await Promise.all([
      this.postgresClient.healthCheck(),
      this.mongoClient.healthCheck(),
      this.redisClient.healthCheck(),
    ]);

    const dependencies: HealthCheckResultDto['dependencies'] = {
      postgres: this.toDependencyHealth(pgResult),
      mongo: this.toDependencyHealth(mongoResult),
      redis: this.toDependencyHealth(redisResult),
    };

    const isAllUp =
      dependencies.postgres.status === 'up' &&
      dependencies.mongo.status === 'up' &&
      dependencies.redis.status === 'up';

    const isAnyUp =
      dependencies.postgres.status === 'up' ||
      dependencies.mongo.status === 'up' ||
      dependencies.redis.status === 'up';

    let status: HealthStatus = 'healthy';
    if (!isAllUp) {
      status = isAnyUp ? 'degraded' : 'unhealthy';
    }

    const mem = process.memoryUsage();

    return {
      status,
      service: env.SERVICE_NAME,
      version: '0.1.0',
      environment: env.NODE_ENV,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      memory: {
        heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
        rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      },
      dependencies,
    };
  }

  private toDependencyHealth(result: {
    isHealthy: boolean;
    latencyMs: number;
    error?: string;
  }): DependencyHealth {
    return {
      status: result.isHealthy ? 'up' : 'down',
      latencyMs: result.latencyMs,
      ...(result.error ? { message: result.error } : {}),
    };
  }
}
