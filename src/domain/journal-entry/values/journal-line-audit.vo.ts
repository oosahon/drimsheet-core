import generateDiff from '@shared/utils/diff-generator';

import {
  IJournalLineAudit,
  IMakeJournalLineAuditPayload,
} from '@domain/journal-entry/types/journal-entry-audit.types';

function make(payload: IMakeJournalLineAuditPayload): IJournalLineAudit {
  const { before, after } = generateDiff(payload.after, payload.before);

  return Object.freeze({
    entityId: payload.after.id,
    entityVersion: payload.after.version,
    action: payload.action,
    diff: { before, after },
    occurredAt: payload.after.updatedAt,
  });
}

const journalLineAudit = Object.freeze({
  make,
});

export default journalLineAudit;
