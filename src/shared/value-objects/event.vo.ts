import {
  IEvent,
  IEventEnrichmentPayload,
  IEventWithEnricher,
} from '../types/event.types';
import stringUtils from '../utils/string';
import { AppError } from './error';

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

/**
 * Creates an event and an event enricher.
 * @param payload The event payload to create.
 * @returns A tuple containing the event and the event enricher.
 */
function make<T>(
  payload: Omit<IEvent<T>, 'occurredAt' | 'enrichedAt'>
): IEventWithEnricher<T> {
  validate(payload);

  const event = Object.freeze({
    type: payload.type,
    data: payload.data,
    occurredAt: new Date(),
    correlationId: payload.correlationId,
    idempotencyKey: payload.idempotencyKey,
  });

  const eventAndEnricher: IEventWithEnricher<T> = {
    event,
    enricher: (enrichmentPayload) =>
      enrich(event, {
        correlationId: enrichmentPayload.correlationId ?? event.correlationId,
        idempotencyKey:
          enrichmentPayload.idempotencyKey ?? event.idempotencyKey,
      }),
  };

  return Object.freeze(eventAndEnricher);
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

const eventValue = Object.freeze({
  make,
  enrich,
  validate,
});

export default eventValue;
