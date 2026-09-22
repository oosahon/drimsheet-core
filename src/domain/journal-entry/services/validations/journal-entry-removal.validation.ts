import journalEntryError from '@domain/journal-entry/errors/journal-entry.error';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
  IJournalEntry,
} from '@domain/journal-entry/types/journal-entry.types';

function validateSourceType(entry: IJournalEntry) {
  const isReversal = entry.sourceType === EJournalEntrySourceType.Reversal;

  if (isReversal) {
    throw new journalEntryError.DeletionNotPermitted({
      sourceType: entry.sourceType,
      status: entry.status,
    });
  }
}

function validateState(entry: IJournalEntry) {
  const isDraftPostingStateInvalid =
    entry.status === EJournalEntryStatus.Draft && entry.postedAt !== null;
  const isPostedPostingStateInvalid =
    entry.status === EJournalEntryStatus.Posted && entry.postedAt === null;
  const isUnsupportedStatus = entry.status === EJournalEntryStatus.Voided;

  if (
    isDraftPostingStateInvalid ||
    isPostedPostingStateInvalid ||
    isUnsupportedStatus
  ) {
    throw new journalEntryError.DeletionNotPermitted({
      sourceType: entry.sourceType,
      status: entry.status,
      postedAt: entry.postedAt,
    });
  }
}

const journalEntryRemovalValidation = Object.freeze({
  validateSourceType,
  validateState,
});

export default journalEntryRemovalValidation;
