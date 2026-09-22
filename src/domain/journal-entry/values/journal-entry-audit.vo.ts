import generateDiff from '@shared/utils/diff-generator';

import {
  IJournalEntryAudit,
  IMakeJournalEntryAuditPayload,
} from '@domain/journal-entry/types/journal-entry-audit.types';
import { IJournalHeader } from '@domain/journal-entry/types/journal-entry.types';

function make<TJournalEntry extends IJournalHeader>(
  payload: IMakeJournalEntryAuditPayload<TJournalEntry>
): IJournalEntryAudit<TJournalEntry> {
  const { before, after } = generateDiff(payload.after, payload.before);

  return Object.freeze({
    entityId: payload.after.id,
    entityVersion: payload.after.version,
    action: payload.action,
    diff: { before, after },
    occurredAt: payload.after.updatedAt,
  });
}

const journalEntryAudit = Object.freeze({
  make,
});

export default journalEntryAudit;
