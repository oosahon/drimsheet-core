import { JournalEntryError } from '.';
import { getMappedErrors, TErrorCause } from '../../../shared/utils/error';

type TErrorKeyPrefix = `journal_entry_error_journal_entry_${string}`;

const EErrorKeys = {
  InvalidStatus: 'journal_entry_error_journal_entry_invalid_status',
  InvalidLineItems: 'journal_entry_error_journal_entry_invalid_line_items',
  InvalidJournalLineItem:
    'journal_entry_error_journal_entry_invalid_journal_line_item',
  UnbalancedJournalEntry:
    'journal_entry_error_journal_entry_unbalanced_journal_entry',
  DuplicateSequenceOrders:
    'journal_entry_error_journal_entry_duplicate_sequence_orders',
} as const satisfies Record<string, TErrorKeyPrefix>;

type USpecificJournalEntryError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class SpecificJournalEntryError extends JournalEntryError<USpecificJournalEntryError> {
  constructor(key: USpecificJournalEntryError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const journalEntryError = Object.freeze({
  Error: SpecificJournalEntryError,
  ...getMappedErrors(EErrorKeys, SpecificJournalEntryError),
});

export default journalEntryError;
