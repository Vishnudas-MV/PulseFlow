import { describe, it, expect } from 'vitest';
import { WebhookEvent, EventStatus } from '@domain/entities/webhook-event.entity';
import { Endpoint, EndpointStatus } from '@domain/entities/endpoint.entity';
import { ValidationError } from '@domain/errors/domain.error';
import { CryptoUtils } from '@shared/utils/crypto';

describe('Domain Entities & Utilities', () => {
  describe('WebhookEvent', () => {
    it('should initialize with correct default properties', () => {
      const event = new WebhookEvent({
        id: 'evt_1',
        tenantId: 'tenant_1',
        destinationEndpointId: 'ep_1',
        eventType: 'payment.succeeded',
        payload: { amount: 100, currency: 'USD' },
        idempotencyKey: 'idemp_1',
      });

      expect(event.status).toBe(EventStatus.PENDING);
      expect(event.retryCount).toBe(0);
      expect(event.maxRetries).toBe(5);
      expect(event.canRetry()).toBe(true);
    });

    it('should transition through lifecycle states', () => {
      const event = new WebhookEvent({
        id: 'evt_2',
        tenantId: 'tenant_1',
        destinationEndpointId: 'ep_1',
        eventType: 'invoice.created',
        payload: {},
        idempotencyKey: 'idemp_2',
      });

      event.markQueued();
      expect(event.status).toBe(EventStatus.QUEUED);

      event.markProcessing();
      expect(event.status).toBe(EventStatus.PROCESSING);

      event.recordFailure('Network timeout', 2000);
      expect(event.status).toBe(EventStatus.FAILED);
      expect(event.retryCount).toBe(1);
      expect(event.nextRetryAt).not.toBeNull();

      event.markDelivered();
      expect(event.status).toBe(EventStatus.DELIVERED);
      expect(event.deliveredAt).not.toBeNull();
    });

    it('should move to DEAD_LETTER after max retries are exceeded', () => {
      const event = new WebhookEvent({
        id: 'evt_3',
        tenantId: 'tenant_1',
        destinationEndpointId: 'ep_1',
        eventType: 'order.cancelled',
        payload: {},
        idempotencyKey: 'idemp_3',
        maxRetries: 2,
      });

      event.recordFailure('500 Server Error');
      expect(event.status).toBe(EventStatus.FAILED);
      expect(event.canRetry()).toBe(true);

      event.recordFailure('500 Server Error');
      expect(event.status).toBe(EventStatus.DEAD_LETTER);
      expect(event.canRetry()).toBe(false);
      expect(event.lastError).toContain('Max retries (2) exceeded');
    });
  });

  describe('Endpoint', () => {
    it('should throw ValidationError on invalid targetUrl', () => {
      expect(() => {
        new Endpoint({
          id: 'ep_1',
          tenantId: 'tenant_1',
          name: 'Stripe Webhook',
          targetUrl: 'invalid-url',
          secretKey: 'secret_1234567890123456',
        });
      }).toThrow(ValidationError);
    });

    it('should trip circuit breaker after consecutive failures threshold', () => {
      const endpoint = new Endpoint({
        id: 'ep_2',
        tenantId: 'tenant_1',
        name: 'Shopify Webhook',
        targetUrl: 'https://example.com/webhook',
        secretKey: 'secret_1234567890123456',
      });

      expect(endpoint.status).toBe(EndpointStatus.ACTIVE);

      for (let i = 0; i < 4; i++) {
        endpoint.recordFailure(5);
        expect(endpoint.status).toBe(EndpointStatus.ACTIVE);
      }

      endpoint.recordFailure(5);
      expect(endpoint.status).toBe(EndpointStatus.CIRCUIT_OPEN);

      endpoint.recordSuccess();
      expect(endpoint.status).toBe(EndpointStatus.ACTIVE);
      expect(endpoint.consecutiveFailures).toBe(0);
    });
  });

  describe('CryptoUtils', () => {
    it('should correctly generate and verify HMAC SHA256 signatures', () => {
      const payload = JSON.stringify({ event: 'ping', timestamp: 123456789 });
      const secret = 'my-super-secret-key-123456';

      const signature = CryptoUtils.generateHmacSha256(payload, secret);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');

      const isValid = CryptoUtils.verifyHmacSha256(payload, secret, signature);
      expect(isValid).toBe(true);

      const isInvalid = CryptoUtils.verifyHmacSha256(payload, 'wrong-secret', signature);
      expect(isInvalid).toBe(false);
    });
  });
});
