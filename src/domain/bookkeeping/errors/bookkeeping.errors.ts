import { BookkeepingError } from '.';
import { getMappedErrors, TErrorCause } from '../../../shared/errors/error';

type TErrorKeyPrefix = `bookkeeping_error_bookkeeping_${string}`;

const EErrorKeys = {
  ControlAccountOpeningBalanceNotAllowed:
    'bookkeeping_error_bookkeeping_control_account_opening_balance_not_allowed',
  ExistingOpeningBalance:
    'bookkeeping_error_bookkeeping_existing_opening_balance',
  UnconfiguredOpeningBalanceAccount:
    'bookkeeping_error_bookkeeping_unconfigured_opening_balance_account',
  AccountNotFound: 'bookkeeping_error_bookkeeping_account_not_found',
  EmptyJournalLines: 'bookkeeping_error_bookkeeping_empty_journal_lines',
  MismatchedJournalLines:
    'bookkeeping_error_bookkeeping_mismatched_journal_lines',
} as const satisfies Record<string, TErrorKeyPrefix>;

type USpecificBookkeepingError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class SpecificBookkeepingError extends BookkeepingError<USpecificBookkeepingError> {
  constructor(key: USpecificBookkeepingError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const bookkeepingError = Object.freeze({
  Error: SpecificBookkeepingError,
  ...getMappedErrors(EErrorKeys, SpecificBookkeepingError),
});

export default bookkeepingError;
