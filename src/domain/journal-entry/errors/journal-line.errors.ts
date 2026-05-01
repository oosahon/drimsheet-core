import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';
import journalEntryError from './journal-entry.error';

type TErrorKeyPrefix = `journal_entry_error_journal_line_${string}`;

const EErrorKeys = {
  InvalidSide: 'journal_entry_error_journal_line_invalid_side',
  UnsupportedExchangeRate:
    'journal_entry_error_journal_line_unsupported_exchange_rate',
  MissingExchangeRate: 'journal_entry_error_journal_line_missing_exchange_rate',
  MismatchedExchangeRateBase:
    'journal_entry_error_journal_line_mismatched_exchange_rate_base',
  MismatchedExchangeRateTarget:
    'journal_entry_error_journal_line_mismatched_exchange_rate_target',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UJournalLineError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class JournalLineError extends journalEntryError.Base<UJournalLineError> {
  constructor(key: UJournalLineError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const journalLineError = Object.freeze({
  Base: JournalLineError,
  ...errorUtils.getMappedErrors(EErrorKeys, JournalLineError),
});

export default journalLineError;
