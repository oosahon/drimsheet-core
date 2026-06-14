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
  InvalidHeaderyEntryId:
    'journal_entry_error_journal_line_invalid_header_entry_id',
  InvalidAccountId: 'journal_entry_error_journal_line_invalid_account_id',
  InvalidSequenceOrder:
    'journal_entry_error_journal_line_invalid_sequence_order',
  InvalidCreatedAt: 'journal_entry_error_journal_line_invalid_created_at',
  InvalidExchangeRate: 'journal_entry_error_journal_line_invalid_exchange_rate',
  InvalidDescription: 'journal_entry_error_journal_line_invalid_description',
  MissingHistory: 'journal_entry_error_journal_line_missing_history',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UJournalLineError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class JournalLineError extends journalEntryError.Base<UJournalLineError> {
  constructor(key: UJournalLineError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'JournalLineError';
  }
}

const journalLineError = Object.freeze({
  Base: JournalLineError,
  ...errorUtils.getMappedErrors(EErrorKeys, JournalLineError),
});

export default journalLineError;
