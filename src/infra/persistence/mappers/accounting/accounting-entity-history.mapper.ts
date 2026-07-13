import { InferSelectModel } from 'drizzle-orm';
import { IAccountingEntityAuditHistory } from '../../../../domain/accounting/types/accounting-entity-audit.types';
import { accountingEntityHistoryInAudit } from '../../../config/drizzle/schema';
import { toRepoDate } from '../shared/date';

export interface IAccountingEntityHistoryRepoModel extends InferSelectModel<
  typeof accountingEntityHistoryInAudit
> {}

const accountingEntityHistoryMapper = {
  toRepo(
    history: IAccountingEntityAuditHistory
  ): Omit<IAccountingEntityHistoryRepoModel, 'id' | 'recordedAt'> {
    return {
      accountingEntityId: history.entityId,
      actorType: history.actor.type,
      action: history.action,
      userId: history.actor.userId,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: toRepoDate(history.occurredAt),
    };
  },
};

export default accountingEntityHistoryMapper;
