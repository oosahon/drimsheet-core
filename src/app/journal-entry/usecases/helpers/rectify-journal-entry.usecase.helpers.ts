import historyValue from '@shared/values/history/history.vo';
import { IUserHistoryActor } from '@shared/values/history/types/history.types';

import {
  EJournalEntryRectificationMode,
  IJournalEntryRectificationResult,
} from '@domain/journal-entry/types/journal-entry-rectification.types';
import {
  EJournalEntryStatus,
  IJournalEntry,
} from '@domain/journal-entry/types/journal-entry.types';

import { IJournalEntryRectificationPersistencePayload } from '@app/journal-entry/contracts/journal-entry-persistence.service.contract';

function getPersistencePayload(
  result: IJournalEntryRectificationResult,
  actor: IUserHistoryActor,
  correlationId: string
): IJournalEntryRectificationPersistencePayload {
  const entriesToCreate = result.entriesToCreate.map(([entry, , audit]) => ({
    entry,
    headerHistory: historyValue.make(audit.header, actor, correlationId),
    lineHistories: audit.lines.map((lineAudit) =>
      historyValue.make(lineAudit, actor, correlationId)
    ),
  }));

  const entryUpdate = result.entryUpdate
    ? {
        entry: result.entryUpdate.entry,
        expectedVersion: result.entryUpdate.expectedVersion,
        headerHistory: historyValue.make(
          result.entryUpdate.headerAudit,
          actor,
          correlationId
        ),
        lineHistories: result.entryUpdate.lineAudits.map((lineAudit) =>
          historyValue.make(lineAudit, actor, correlationId)
        ),
        linesToCreate: result.entryUpdate.linesToCreate,
        linesToUpdate: result.entryUpdate.linesToUpdate,
        lineIdsToDelete: result.entryUpdate.lineIdsToDelete,
      }
    : null;

  return { entriesToCreate, entryUpdate };
}

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
  getPersistencePayload,
  getEntriesForBalancePropagation,
});

export default rectifyJournalEntryUseCaseHelpers;
