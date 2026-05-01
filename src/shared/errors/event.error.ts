import { TErrorCause } from '../types/error.types';
import errorUtils from '../utils/error';
import { ValueError } from './value.error';

type TErrorKeyPrefix = `value_error_event_${string}`;

const EErrorKeys = {
  CorrelationIdOverwrite: 'value_error_event_correlation_id_overwrite',
  IdempotencyKeyOverwrite: 'value_error_event_idempotency_key_overwrite',
  InvalidCorrelationId: 'value_error_event_invalid_correlation_id',
  InvalidIdempotencyKey: 'value_error_event_invalid_idempotency_key',
  MissingEventType: 'value_error_event_missing_event_type',
  MissingEventData: 'value_error_event_missing_event_data',
  EventTypeMismatch: 'value_error_event_event_type_mismatch',
  MissingKey: 'value_error_event_missing_key',
  InvalidKey: 'value_error_event_invalid_key',
  InvalidType: 'value_error_event_invalid_type',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UEventError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class EventError extends ValueError<UEventError> {
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
