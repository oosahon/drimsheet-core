import {
  EJournalEntryRectificationMode,
  IJournalEntryRectificationResult,
} from '@domain/journal-entry/types/journal-entry-rectification.types';
import {
  EJournalEntryStatus,
  IJournalEntry,
} from '@domain/journal-entry/types/journal-entry.types';

function getEntriesForBalancePropagation(
  result: IJournalEntryRectificationResult
): IJournalEntry[] {
  const entries: IJournalEntry[] = [];

  if (result.reversingJournalEntry) {
    entries.push(result.reversingJournalEntry);
  }

  const shouldPropagateCurrentEntry =
    result.currentJournalEntry.status === EJournalEntryStatus.Posted &&
    result.mode !== EJournalEntryRectificationMode.UpdateMeta;

  if (shouldPropagateCurrentEntry) {
    entries.push(result.currentJournalEntry);
  }

  return entries;
}

const rectifyJournalEntryUseCaseHelpers = Object.freeze({
  getEntriesForBalancePropagation,
});

export default rectifyJournalEntryUseCaseHelpers;
