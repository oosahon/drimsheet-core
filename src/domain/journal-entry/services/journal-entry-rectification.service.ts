import getOppositeJournalSide from '@domain/journal-entry/entities/helpers/get-opposite-side.helper';
import journalEntryEntity from '@domain/journal-entry/entities/journal-entry.entity';
import journalEntryRectificationValidation from '@domain/journal-entry/services/validations/journal-entry-rectification.validation';
import {
  EJournalEntryRectificationMode,
  IJournalEntryRectificationPayload,
  IJournalEntryRectificationResult,
  IJournalEntryRectificationService,
  UJournalEntryRectificationMode,
} from '@domain/journal-entry/types/journal-entry-rectification.types';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '@domain/journal-entry/types/journal-entry.types';

function determineAction(
  payload: IJournalEntryRectificationPayload
): UJournalEntryRectificationMode {
  if (payload.originalEntry.status === EJournalEntryStatus.Draft) {
    return EJournalEntryRectificationMode.UpdateDraft;
  }

  return journalEntryEntity.hasOnlyMetadataChanges(
    payload.originalEntry,
    payload.newEntry
  )
    ? EJournalEntryRectificationMode.UpdateMeta
    : EJournalEntryRectificationMode.VoidAndReplace;
}

function updateEntry(
  payload: IJournalEntryRectificationPayload,
  mode: Exclude<UJournalEntryRectificationMode, 'void_and_replace'>
): IJournalEntryRectificationResult {
  const [currentJournalEntry, events, audit] = journalEntryEntity.update(
    payload.originalEntry,
    payload.newEntry
  );
  const originalLineIds = new Set(
    payload.originalEntry.lines.map((line) => line.id)
  );
  const currentLineIds = new Set(
    currentJournalEntry.lines.map((line) => line.id)
  );
  const linesToCreate = currentJournalEntry.lines.filter(
    (line) => !originalLineIds.has(line.id)
  );
  const linesToUpdate = currentJournalEntry.lines.filter((line) => {
    const originalLine = payload.originalEntry.lines.find(
      (item) => item.id === line.id
    );

    return originalLine !== undefined && line.version !== originalLine.version;
  });
  const lineIdsToDelete = payload.originalEntry.lines
    .filter((line) => !currentLineIds.has(line.id))
    .map((line) => line.id);

  return {
    mode,
    originalJournalEntryId: payload.originalEntry.id,
    currentJournalEntry,
    reversingJournalEntry: null,
    entriesToCreate: [],
    entryUpdate: {
      entry: currentJournalEntry,
      expectedVersion: payload.originalEntry.version,
      headerAudit: audit.header,
      lineAudits: audit.lines,
      linesToCreate,
      linesToUpdate,
      lineIdsToDelete,
    },
    events,
  };
}

function voidAndReplace(
  payload: IJournalEntryRectificationPayload
): IJournalEntryRectificationResult {
  const { originalEntry, newEntry } = payload;
  const timestamp = new Date();
  const correctedLines = newEntry.lines ?? originalEntry.lines;
  const functionalCurrency = correctedLines[0].functionalAmount.currency;
  const correctedEntry = journalEntryEntity.make({
    id: newEntry.id,
    accountingEntityId: originalEntry.accountingEntityId,
    sourceType: originalEntry.sourceType,
    effectiveDate: newEntry.effectiveDate ?? originalEntry.effectiveDate,
    postedAt: timestamp,
    memo: newEntry.memo === undefined ? originalEntry.memo : newEntry.memo,
    createdBy: originalEntry.createdBy,
    functionalCurrency,
    attachments: newEntry.attachments ?? originalEntry.attachments,
    lines: correctedLines.map((line) => ({
      accountId: line.accountId,
      counterpartyId: line.counterpartyId,
      sequenceOrder: line.sequenceOrder,
      amount: line.amount,
      exchangeRate: line.exchangeRate,
      side: line.side,
      description: line.description,
      functionalCurrency,
    })),
  });
  const [correctedJournalEntry, correctedEvents] = correctedEntry;
  const reversalEntry = journalEntryEntity.make({
    accountingEntityId: originalEntry.accountingEntityId,
    sourceType: EJournalEntrySourceType.Reversal,
    effectiveDate: timestamp,
    postedAt: timestamp,
    memo: 'Journal entry reversal',
    createdBy: originalEntry.createdBy,
    functionalCurrency,
    lines: originalEntry.lines.map((line) => ({
      accountId: line.accountId,
      counterpartyId: line.counterpartyId,
      sequenceOrder: line.sequenceOrder,
      amount: line.amount,
      exchangeRate: line.exchangeRate,
      side: getOppositeJournalSide(line.side),
      description: line.description,
      functionalCurrency,
    })),
  });
  const [reversingJournalEntry, reversingEvents] = reversalEntry;
  const [voidedOriginal, voidEvents, voidAudit] = journalEntryEntity.void(
    originalEntry,
    {
      voidingEntryId: reversingJournalEntry.id,
    }
  );

  return {
    mode: EJournalEntryRectificationMode.VoidAndReplace,
    originalJournalEntryId: originalEntry.id,
    currentJournalEntry: correctedJournalEntry,
    reversingJournalEntry,
    entriesToCreate: [reversalEntry, correctedEntry],
    entryUpdate: {
      entry: voidedOriginal,
      expectedVersion: originalEntry.version,
      headerAudit: voidAudit,
      lineAudits: [],
      linesToCreate: [],
      linesToUpdate: [],
      lineIdsToDelete: [],
    },
    events: [...voidEvents, ...reversingEvents, ...correctedEvents],
  };
}

/**
 * Selects and prepares the invariant-preserving rectification for a journal
 * entry without performing persistence or publishing events.
 */
function makeRectify(): IJournalEntryRectificationService['rectify'] {
  return (payload) => {
    journalEntryRectificationValidation.validatePayload(payload);
    journalEntryRectificationValidation.validateHasChanges(payload);

    const action = determineAction(payload);

    if (action === EJournalEntryRectificationMode.VoidAndReplace) {
      return voidAndReplace(payload);
    }

    return updateEntry(payload, action);
  };
}

export default function makeJournalEntryRectificationService(): IJournalEntryRectificationService {
  return Object.freeze({
    rectify: makeRectify(),
  });
}
