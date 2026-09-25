import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';

import journalEntryError from './journal-entry.error';

const EErrorKeys = {
  InvalidCreatedBy: 'journal_entry_error_journal_line_created_by_invalid',
  InvalidId: 'journal_entry_error_journal_line_id_invalid',
  InvalidSide: 'journal_entry_error_journal_line_side_invalid',
  UnsupportedExchangeRate:
    'journal_entry_error_journal_line_unsupported_exchange_rate_invalid',
  MissingExchangeRate:
    'journal_entry_error_journal_line_missing_exchange_rate_invalid',
  MismatchedExchangeRateBase:
    'journal_entry_error_journal_line_mismatched_exchange_rate_base_invalid',
  MismatchedExchangeRateTarget:
    'journal_entry_error_journal_line_mismatched_exchange_rate_target_invalid',
  InvalidHeaderyEntryId:
    'journal_entry_error_journal_line_header_entry_id_invalid',
  InvalidAccountId: 'journal_entry_error_journal_line_account_id_invalid',
  InvalidCounterpartyId:
    'journal_entry_error_journal_line_counterparty_id_invalid',
  InvalidSequenceOrder:
    'journal_entry_error_journal_line_sequence_order_invalid',
  InvalidCreatedAt: 'journal_entry_error_journal_line_created_at_invalid',
  InvalidExchangeRate: 'journal_entry_error_journal_line_exchange_rate_invalid',
  InvalidDescription: 'journal_entry_error_journal_line_description_invalid',
  MissingHistory: 'journal_entry_error_journal_line_missing_history_unexpected',
} as const satisfies TErrorKeys<'journal_entry_error_journal_line'>;

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
