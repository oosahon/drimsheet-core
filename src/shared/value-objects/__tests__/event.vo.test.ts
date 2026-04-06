import eventValue from '../event.vo';
import { AppError } from '../error';

describe('event.vo', () => {
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';
  const validUUID2 = '987fcdeb-51a2-43d7-9012-3456789abcde';

  describe('make', () => {
    it('creates an event successfully with valid payload', () => {
      const payload = { type: 'TestEvent', data: { id: 1 } };
      const { event, enricher } = eventValue.make(payload);

      expect(event.type).toBe('TestEvent');
      expect(event.data).toEqual({ id: 1 });
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.correlationId).toBeUndefined();
      expect(event.idempotencyKey).toBeUndefined();
      expect(typeof enricher).toBe('function');
    });

    it('throws error if type is empty or missing', () => {
      expect(() => eventValue.make({ type: '', data: {} })).toThrow(AppError);
    });

    it('throws error if type exceeds max length', () => {
      const longType = 'a'.repeat(256);
      expect(() => eventValue.make({ type: longType, data: {} })).toThrow(
        AppError
      );
    });

    it('throws error if data is missing', () => {
      expect(() =>
        eventValue.make({ type: 'TestEvent', data: null as any })
      ).toThrow(AppError);
      expect(() =>
        eventValue.make({ type: 'TestEvent', data: undefined as any })
      ).toThrow(AppError);
    });

    it('creates event with correlationId and idempotencyKey', () => {
      const payload = {
        type: 'TestEvent',
        data: {},
        correlationId: validUUID,
        idempotencyKey: validUUID2,
      };
      const { event } = eventValue.make(payload);

      expect(event.correlationId).toBe(validUUID);
      expect(event.idempotencyKey).toBe(validUUID2);
    });

    it('throws error if correlationId is not a string', () => {
      expect(() =>
        eventValue.make({
          type: 'TestEvent',
          data: {},
          correlationId: 123 as any,
        })
      ).toThrow(AppError);
    });
  });

  describe('enricher', () => {
    it('enriches the event with correlationId and idempotencyKey', () => {
      const { enricher } = eventValue.make({ type: 'TestEvent', data: {} });

      const enrichedEvent = enricher({
        correlationId: validUUID,
        idempotencyKey: validUUID2,
      });

      expect(enrichedEvent.correlationId).toBe(validUUID);
      expect(enrichedEvent.idempotencyKey).toBe(validUUID2);
      expect(enrichedEvent.enrichedAt).toBeInstanceOf(Date);
    });

    it('throws error if trying to overwrite existing correlationId', () => {
      const { enricher } = eventValue.make({
        type: 'TestEvent',
        data: {},
        correlationId: validUUID,
      });

      expect(() => enricher({ correlationId: validUUID2 })).toThrow(
        'Correlation ID cannot be overwritten'
      );
    });

    it('throws error if trying to overwrite existing idempotencyKey', () => {
      const { enricher } = eventValue.make({
        type: 'TestEvent',
        data: {},
        idempotencyKey: validUUID,
      });

      expect(() => enricher({ idempotencyKey: validUUID2 })).toThrow(
        'Idempotency key cannot be overwritten'
      );
    });

    it('allows enrichment with same existing values (idempotent)', () => {
      const { enricher } = eventValue.make({
        type: 'TestEvent',
        data: {},
        correlationId: validUUID,
        idempotencyKey: validUUID2,
      });

      const enrichedEvent = enricher({
        correlationId: validUUID,
        idempotencyKey: validUUID2,
      });

      expect(enrichedEvent.correlationId).toBe(validUUID);
      expect(enrichedEvent.idempotencyKey).toBe(validUUID2);
    });

    it('throws error if enriched with non-string correlationId or idempotencyKey', () => {
      const { enricher } = eventValue.make({ type: 'TestEvent', data: {} });
      expect(() => enricher({ correlationId: 123 as any })).toThrow(AppError);
      expect(() => enricher({ idempotencyKey: 123 as any })).toThrow(AppError);
    });
  });

  describe('validate', () => {
    it('passes for valid payload', () => {
      expect(() =>
        eventValue.validate({ type: 'ValidType', data: {} })
      ).not.toThrow();
    });
  });
});
