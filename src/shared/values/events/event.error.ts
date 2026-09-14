import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import DomainError from '@shared/values/errors/domain.error';

const EErrorKeys = {
  InvalidEventType: 'event_error_invalid_event_type_unexpected',
  CorrelationIdOverwrite: 'event_error_correlation_id_overwrite_unexpected',
  IdempotencyKeyOverwrite: 'event_error_idempotency_key_overwrite_unexpected',
  InvalidCorrelationId: 'event_error_invalid_correlation_id_unexpected',
  InvalidIdempotencyKey: 'event_error_invalid_idempotency_key_unexpected',
  MissingEventType: 'event_error_missing_event_type_unexpected',
  MissingEventData: 'event_error_missing_event_data_unexpected',
  EventTypeMismatch: 'event_error_event_type_mismatch_unexpected',
  MissingKey: 'event_error_missing_key_unexpected',
  InvalidKey: 'event_error_invalid_key_unexpected',
  InvalidType: 'event_error_invalid_type_unexpected',
} as const satisfies TErrorKeys<'event_error'>;

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
