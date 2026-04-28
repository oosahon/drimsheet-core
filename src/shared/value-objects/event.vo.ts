import { AppError } from '../errors/error';
import { IEvent, IEventEnrichmentPayload } from '../types/event.types';
import stringUtils from '../utils/string';

/**
 * Enriches an event with correlation and idempotency keys.
 * @param event The event to enrich.
 * @param payload The correlation and idempotency keys to enrich the event with.
 * @returns The enriched event.
 */
function enrich<T>(
  event: IEvent<T>,
  payload: { correlationId?: string; idempotencyKey?: string }
): IEvent<T> {
  const isOverwritingCorrelationId =
    event.correlationId !== undefined &&
    payload.correlationId !== event.correlationId;

  if (isOverwritingCorrelationId) {
    throw new AppError('Correlation ID cannot be overwritten', {
      cause: payload,
    });
  }

  const isOverwritingIdempotencyKey =
    event.idempotencyKey !== undefined &&
    payload.idempotencyKey !== event.idempotencyKey;

  if (isOverwritingIdempotencyKey) {
    throw new AppError('Idempotency key cannot be overwritten', {
      cause: payload,
    });
  }

  validateEnrichmentPayload(payload);

  const type = stringUtils.sanitizeAndValidate(event.type, {
    min: 1,
    max: 255,
  });

  return Object.freeze({
    type,
    data: event.data,
    occurredAt: event.occurredAt,
    correlationId: payload.correlationId,
    idempotencyKey: payload.idempotencyKey,
    enrichedAt: new Date(),
  });
}

function enrichAll<T = unknown>(
  events: IEvent<T>[],
  payload: { correlationId?: string; idempotencyKey?: string }
): IEvent<T>[] {
  return events.map((event) => enrich(event, payload));
}

/**
 * Creates an event and an event enricher.
 * @param payload The event payload to create.
 * @returns A tuple containing the event and the event enricher.
 */
function make<T>(
  payload: Omit<IEvent<T>, 'occurredAt' | 'enrichedAt'>
): IEvent<T> {
  validate(payload);

  const event: IEvent<T> = Object.freeze({
    type: payload.type,
    data: payload.data,
    occurredAt: new Date(),
    correlationId: payload.correlationId,
    idempotencyKey: payload.idempotencyKey,
    enrichedAt: null,
  });
  return Object.freeze(event);
}

function validateEnrichmentPayload(payload: IEventEnrichmentPayload) {
  if (
    payload.correlationId !== undefined &&
    typeof payload.correlationId !== 'string'
  ) {
    throw new AppError('Correlation ID must be a string', { cause: payload });
  }
  if (
    payload.idempotencyKey !== undefined &&
    typeof payload.idempotencyKey !== 'string'
  ) {
    throw new AppError('Idempotency key must be a string', { cause: payload });
  }
}

/**
 * Validates an event payload.
 * @param payload The event payload to validate.
 * @throws {AppError} If the event payload is invalid.
 */
function validate<T = object>(
  payload: Omit<IEvent<T>, 'occurredAt' | 'enrichedAt'>
) {
  if (!stringUtils.isNonEmptyString(payload.type)) {
    throw new AppError('Event type is required', { cause: payload });
  }

  stringUtils.sanitizeAndValidate(payload.type, {
    min: 1,
    max: 255,
  });

  if (payload.data === undefined || payload.data === null) {
    throw new AppError('Event data is required', { cause: payload });
  }

  validateEnrichmentPayload(payload);
}

function validateEventTypeMatch(event: IEvent<unknown>, expectedType: string) {
  if (event.type !== expectedType) {
    throw new AppError('Event type does not match expected type', {
      cause: { eventType: event.type, expectedType },
    });
  }
}

function validateKey(key: string) {
  if (!stringUtils.isNonEmptyString(key)) {
    throw new AppError('Key is required', { cause: key });
  }

  const isDomainEvent = key.startsWith('domain');
  const isApplicationEvent = key.startsWith('app');
  const isInfrastructureEvent = key.startsWith('infra');

  if (!isDomainEvent && !isApplicationEvent && !isInfrastructureEvent) {
    throw new AppError('Invalid event key', { cause: key });
  }
}

const eventValue = Object.freeze({
  make,
  enrich,
  enrichAll,
  validate,
  validateKey,
  validateEventTypeMatch,
});

export default eventValue;
