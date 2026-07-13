import DomainError from '../errors/domain.error';
import { TErrorCause } from '../types/error.types';
import errorUtils from '../utils/error';

type TErrorKeyPrefix = `event_error_${string}`;

const EErrorKeys = {
  InvalidValue: 'event_error_invalid_value',
  CorrelationIdOverwrite: 'event_error_correlation_id_overwrite',
  IdempotencyKeyOverwrite: 'event_error_idempotency_key_overwrite',
  InvalidCorrelationId: 'event_error_invalid_correlation_id',
  InvalidIdempotencyKey: 'event_error_invalid_idempotency_key',
  MissingEventType: 'event_error_missing_event_type',
  MissingEventData: 'event_error_missing_event_data',
  EventTypeMismatch: 'event_error_event_type_mismatch',
  MissingKey: 'event_error_missing_key',
  InvalidKey: 'event_error_invalid_key',
  InvalidType: 'event_error_invalid_type',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UEventError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class EventError extends DomainError<UEventError> {
  constructor(key: UEventError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'EventError';
  }
}

const eventError = Object.freeze({
  Base: EventError,
  ...errorUtils.getMappedErrors(EErrorKeys, EventError),
});

export default eventError;
