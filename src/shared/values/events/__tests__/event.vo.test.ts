import eventError from '@shared/values/events/event.error';
import eventValue from '@shared/values/events/event.vo';

describe('event.vo', () => {
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';
  const validUUID2 = '987fcdeb-51a2-43d7-9012-3456789abcde';

  describe('make', () => {
    it('creates an event successfully with valid payload', () => {
      const payload = { type: 'TestEvent', data: { id: 1 } };
      const event = eventValue.make(payload);

      expect(event.type).toBe('TestEvent');
      expect(event.data).toEqual({ id: 1 });
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.correlationId).toBeUndefined();
      expect(event.idempotencyKey).toBeUndefined();
    });

    it('throws error if type is empty or missing', () => {
      expect(() => eventValue.make({ type: '', data: {} })).toThrow(
        eventError.MissingEventType
      );
    });

    it('throws error if type exceeds max length', () => {
      const longType = 'a'.repeat(256);
      expect(() => eventValue.make({ type: longType, data: {} })).toThrow(
        eventError.InvalidValue
      );
    });

    it('throws error if data is missing', () => {
      expect(() =>
        eventValue.make({ type: 'TestEvent', data: null as any })
      ).toThrow(eventError.MissingEventData);
      expect(() =>
        eventValue.make({ type: 'TestEvent', data: undefined as any })
      ).toThrow(eventError.MissingEventData);
    });

    it('creates event with correlationId and idempotencyKey', () => {
      const payload = {
        type: 'TestEvent',
        data: {},
        correlationId: validUUID,
        idempotencyKey: validUUID2,
      };
      const event = eventValue.make(payload);

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
      ).toThrow(eventError.InvalidCorrelationId);
    });
  });

  describe('enrich', () => {
    it('enriches the event with correlationId and idempotencyKey', () => {
      const event = eventValue.make({ type: 'TestEvent', data: {} });

      const enrichedEvent = eventValue.enrich(event, {
        correlationId: validUUID,
        idempotencyKey: validUUID2,
      });

      expect(enrichedEvent.correlationId).toBe(validUUID);
      expect(enrichedEvent.idempotencyKey).toBe(validUUID2);
      expect(enrichedEvent.enrichedAt).toBeInstanceOf(Date);
    });

    it('throws error if trying to overwrite existing correlationId', () => {
      const event = eventValue.make({
        type: 'TestEvent',
        data: {},
        correlationId: validUUID,
      });

      expect(() =>
        eventValue.enrich(event, { correlationId: validUUID2 })
      ).toThrow(eventError.CorrelationIdOverwrite);
    });

    it('throws error if trying to overwrite existing idempotencyKey', () => {
      const event = eventValue.make({
        type: 'TestEvent',
        data: {},
        idempotencyKey: validUUID,
      });

      expect(() =>
        eventValue.enrich(event, { idempotencyKey: validUUID2 })
      ).toThrow(eventError.IdempotencyKeyOverwrite);
    });

    it('allows enrichment with same existing values (idempotent)', () => {
      const event = eventValue.make({
        type: 'TestEvent',
        data: {},
        correlationId: validUUID,
        idempotencyKey: validUUID2,
      });

      const enrichedEvent = eventValue.enrich(event, {
        correlationId: validUUID,
        idempotencyKey: validUUID2,
      });

      expect(enrichedEvent.correlationId).toBe(validUUID);
      expect(enrichedEvent.idempotencyKey).toBe(validUUID2);
    });

    it('throws error if enriched with non-string correlationId or idempotencyKey', () => {
      const event = eventValue.make({ type: 'TestEvent', data: {} });
      expect(() =>
        eventValue.enrich(event, { correlationId: 123 as any })
      ).toThrow(eventError.InvalidCorrelationId);
      expect(() =>
        eventValue.enrich(event, { idempotencyKey: 123 as any })
      ).toThrow(eventError.InvalidIdempotencyKey);
    });
  });

  describe('validateEventTypeMatch', () => {
    it('passes if the event type matches the expected type', () => {
      const event = eventValue.make({ type: 'TestEvent', data: {} });
      expect(() =>
        eventValue.validateEventTypeMatch(event, 'TestEvent')
      ).not.toThrow();
    });

    it('throws error if the event type does not match', () => {
      const event = eventValue.make({ type: 'TestEvent', data: {} });
      expect(() =>
        eventValue.validateEventTypeMatch(event, 'OtherEvent')
      ).toThrow(eventError.EventTypeMismatch);
    });
  });

  describe('validate', () => {
    it('passes for valid payload', () => {
      expect(() =>
        eventValue.validate({ type: 'ValidType', data: {} })
      ).not.toThrow();
    });
  });

  describe('enrichAll', () => {
    it('enriches multiple events successfully', () => {
      const events = [
        eventValue.make({ type: 'Event1', data: { val: 1 } }),
        eventValue.make({ type: 'Event2', data: { val: 2 } }),
      ];

      const enriched = eventValue.enrichAll(events, {
        correlationId: validUUID,
        idempotencyKey: validUUID2,
      });

      expect(enriched).toHaveLength(2);
      expect(enriched[0].correlationId).toBe(validUUID);
      expect(enriched[0].idempotencyKey).toBe(validUUID2);
      expect(enriched[1].correlationId).toBe(validUUID);
      expect(enriched[1].idempotencyKey).toBe(validUUID2);
    });
  });

  describe('validateKey', () => {
    it('passes for valid keys starting with domain, app, or infra', () => {
      expect(() => eventValue.validateKey('domain.user.created')).not.toThrow();
      expect(() => eventValue.validateKey('app.user.verify')).not.toThrow();
      expect(() => eventValue.validateKey('infra.db.connected')).not.toThrow();
    });

    it('throws MissingKey if key is empty or not a non-empty string', () => {
      expect(() => eventValue.validateKey('')).toThrow(eventError.MissingKey);
      expect(() => eventValue.validateKey('   ')).toThrow(
        eventError.MissingKey
      );
      expect(() => eventValue.validateKey(null as any)).toThrow(
        eventError.MissingKey
      );
    });

    it('throws InvalidKey if key does not start with domain, app, or infra', () => {
      expect(() => eventValue.validateKey('other.event.name')).toThrow(
        eventError.InvalidKey
      );
      expect(() => eventValue.validateKey('domain')).not.toThrow(); // starts with domain
      expect(() => eventValue.validateKey('domai')).toThrow(
        eventError.InvalidKey
      );
    });
  });
});
