import { getMappedErrors, TErrorCause } from '../utils/error';
import { ValueError } from './value.errors';

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

type USpecificEventError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class SpecificEventError extends ValueError<USpecificEventError> {
  constructor(key: USpecificEventError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'EventError';
  }
}

const eventError = Object.freeze({
  Error: SpecificEventError,
  ...getMappedErrors(EErrorKeys, SpecificEventError),
});

export default eventError;
