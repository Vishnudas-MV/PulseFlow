import { Endpoint, EndpointStatus } from '../entities/endpoint.entity';

export interface IEndpointRepository {
  findById(id: string, tenantId: string): Promise<Endpoint | null>;
  findByTenantId(tenantId: string): Promise<Endpoint[]>;
  save(endpoint: Endpoint): Promise<void>;
  update(endpoint: Endpoint): Promise<void>;
  updateStatus(id: string, status: EndpointStatus): Promise<void>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
