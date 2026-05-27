import DomainError from '../../../shared/errors/domain.error';
import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';

type TErrorPrefix = `journal_entry_error_${string}`;

class JournalEntryError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'JournalEntryError';
  }
}

const EErrorKeys = {
  InvalidValue: 'journal_entry_error_invalid_value',
  InvalidStatus: 'journal_entry_error_invalid_status',
  InvalidLineItems: 'journal_entry_error_invalid_line_items',
  InvalidJournalLineItem: 'journal_entry_error_invalid_journal_line_item',
  UnbalancedJournalEntry: 'journal_entry_error_unbalanced_journal_entry',
  DuplicateSequenceOrders: 'journal_entry_error_duplicate_sequence_orders',
  InvalidSourceType: 'journal_entry_error_invalid_source_type',
  CounterpartyIdNotAllowed: 'journal_entry_error_counterparty_id_not_allowed',
  InvalidPOstingDate: 'journal_entry_error_invalid_posting_date',
  InvalidVoidedAt: 'journal_entry_error_invalid_voided_at',
  InvalidCounterpartyId: 'journal_entry_error_invalid_counterparty_id',
  InvalidMemo: 'journal_entry_error_invalid_memo',
} as const satisfies Record<string, TErrorPrefix>;

const journalEntryError = Object.freeze({
  Base: JournalEntryError,
  ...errorUtils.getMappedErrors(EErrorKeys, JournalEntryError),
});

export default journalEntryError;
