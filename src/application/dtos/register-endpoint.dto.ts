import { z } from 'zod';

export const RegisterEndpointSchema = z.object({
  tenantId: z.string().min(1, 'tenantId is required'),
  name: z.string().min(1, 'name is required').max(100),
  targetUrl: z.string().url('Must be a valid URL (http or https)'),
  secretKey: z
    .string()
    .min(16, 'secretKey must be at least 16 characters for cryptographic HMAC safety'),
  rateLimit: z.number().int().positive().optional().default(100),
});

export type RegisterEndpointDto = z.infer<typeof RegisterEndpointSchema>;

export interface RegisterEndpointResponseDto {
  endpointId: string;
  name: string;
  targetUrl: string;
  status: string;
  createdAt: string;
}
