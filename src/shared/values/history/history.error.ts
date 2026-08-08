import { TErrorCause } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import DomainError from '@shared/values/errors/domain.error';

type TErrorKeyPrefix = `history_error_${string}`;

const EErrorKeys = {
  InvalidActor: 'history_error_invalid_actor',
  InvalidAction: 'history_error_invalid_action',
  InvalidDiff: 'history_error_invalid_diff',
  InvalidNote: 'history_error_invalid_note',
  InvalidEntityId: 'history_error_invalid_entity_id',
  InvalidDate: 'history_error_invalid_date',
  InvalidCorrelationId: 'history_error_invalid_correlation_id',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UHistoryError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class HistoryError extends DomainError<UHistoryError> {
  constructor(key: UHistoryError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'HistoryError';
  }
}

const historyError = Object.freeze({
  Base: HistoryError,
  ...errorUtils.getMappedErrors(EErrorKeys, HistoryError),
});

export default historyError;
