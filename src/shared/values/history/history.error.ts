import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import DomainError from '@shared/values/errors/domain.error';

const EErrorKeys = {
  InvalidActorId: 'history_error_actor_id_unexpected',
  InvalidOnBehalfOf: 'history_error_on_behalf_of_unexpected',
  InvalidAction: 'history_error_invalid_action_unexpected',
  InvalidDiff: 'history_error_invalid_diff_unexpected',
  InvalidNote: 'history_error_invalid_note_unexpected',
  InvalidEntityId: 'history_error_invalid_entity_id_unexpected',
  InvalidDate: 'history_error_invalid_date_unexpected',
  InvalidEntityVersion: 'history_error_invalid_entity_version_unexpected',
  InvalidCorrelationId: 'history_error_invalid_correlation_id_unexpected',
} as const satisfies TErrorKeys<'history_error'>;

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
