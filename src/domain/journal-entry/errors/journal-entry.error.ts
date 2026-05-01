import DomainError from '../../../shared/errors/domain.error';
import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';

type TErrorPrefix = `journal_entry_error_${string}`;

export class JournalEntryError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
  }
}

const EErrorKeys = {
  InvalidStatus: 'journal_entry_error_invalid_status',
  InvalidLineItems: 'journal_entry_error_invalid_line_items',
  InvalidJournalLineItem: 'journal_entry_error_invalid_journal_line_item',
  UnbalancedJournalEntry: 'journal_entry_error_unbalanced_journal_entry',
  DuplicateSequenceOrders: 'journal_entry_error_duplicate_sequence_orders',
} as const satisfies Record<string, TErrorPrefix>;

type USpecificJournalEntryError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class SpecificJournalEntryError extends JournalEntryError<USpecificJournalEntryError> {
  constructor(key: USpecificJournalEntryError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const journalEntryError = Object.freeze({
  Error: SpecificJournalEntryError,
  ...errorUtils.getMappedErrors(EErrorKeys, SpecificJournalEntryError),
});

export default journalEntryError;
