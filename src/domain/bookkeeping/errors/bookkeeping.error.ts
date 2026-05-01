import DomainError from '../../../shared/errors/domain.error';
import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';

type TErrorPrefix = `bookkeeping_error_${string}`;

class BookkeepingError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
  }
}

const EErrorKeys = {
  InvalidValue: 'bookkeeping_error_invalid_value',
  ControlAccountOpeningBalanceNotAllowed:
    'bookkeeping_error_control_account_opening_balance_not_allowed',
  ExistingOpeningBalance: 'bookkeeping_error_existing_opening_balance',
  UnconfiguredOpeningBalanceAccount:
    'bookkeeping_error_unconfigured_opening_balance_account',
  AccountNotFound: 'bookkeeping_error_account_not_found',
  EmptyJournalLines: 'bookkeeping_error_empty_journal_lines',
  MismatchedJournalLines: 'bookkeeping_error_mismatched_journal_lines',
} as const satisfies Record<string, TErrorPrefix>;

const bookkeepingError = Object.freeze({
  Base: BookkeepingError,
  ...errorUtils.getMappedErrors(EErrorKeys, BookkeepingError),
});

export default bookkeepingError;
