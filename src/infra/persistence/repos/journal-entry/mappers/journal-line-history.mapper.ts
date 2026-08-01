import { InferSelectModel } from 'drizzle-orm';
import { IJournalLineHistory } from '../../../../../domain/journal-entry/types/journal-entry-audit.types';
import { IJournalLine } from '../../../../../domain/journal-entry/types/journal-line.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import { journalLineHistoryInAudit } from '../../../../config/drizzle/schema';
import { toRepoDate } from '../../../helpers/date.mapper';
import journalLineMapper from './journal-line.mapper';

export interface IJournalLineHistoryModel extends InferSelectModel<
  typeof journalLineHistoryInAudit
> {}

function mapSnapshot(snapshot: IJournalLine | null) {
  return snapshot ? journalLineMapper.toRepo(snapshot) : null;
}

const journalLineHistoryMapper = {
  toRepo(
    line: IJournalLine,
    history: IJournalLineHistory,
    accountingEntityId: TEntityId
  ): Omit<IJournalLineHistoryModel, 'id' | 'recordedAt'> {
    return {
      journalLineId: history.entityId,
      journalEntryId: line.entryId,
      accountingEntityId,
      userId: history.actor.userId,
      actorType: history.actor.type,
      action: history.action,
      diff: {
        before: mapSnapshot(history.diff.before),
        after: mapSnapshot(history.diff.after),
      },
      correlationId: history.correlationId,
      entityVersion: line.version,
      occurredAt: toRepoDate(history.occurredAt),
    };
  },
};

export default journalLineHistoryMapper;
