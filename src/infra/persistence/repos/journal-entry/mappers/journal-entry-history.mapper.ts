import { InferSelectModel } from 'drizzle-orm';

import {
  IJournalEntryHistory,
  IJournalEntryRectificationHistory,
} from '@domain/journal-entry/types/journal-entry-audit.types';
import { IJournalHeader } from '@domain/journal-entry/types/journal-entry.types';

import { journalEntryHistoryInAudit } from '@infra/config/drizzle/schema';
import { toRepoDate } from '@infra/persistence/helpers/date.mapper';

export interface IJournalEntryHistoryModel extends InferSelectModel<
  typeof journalEntryHistoryInAudit
> {}

const journalEntryHistoryMapper = {
  toRepo(
    header: IJournalHeader,
    history: IJournalEntryHistory | IJournalEntryRectificationHistory
  ): Omit<IJournalEntryHistoryModel, 'id' | 'recordedAt'> {
    return {
      journalEntryId: history.entityId,
      accountingEntityId: header.accountingEntityId,
      userId: history.actor.userId,
      actorType: history.actor.type,
      action: history.action,
      diff: history.diff,
      correlationId: history.correlationId,
      entityVersion: history.entityVersion,
      occurredAt: toRepoDate(history.occurredAt),
    };
  },
};

export default journalEntryHistoryMapper;
