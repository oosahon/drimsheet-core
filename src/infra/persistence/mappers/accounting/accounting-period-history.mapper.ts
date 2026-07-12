import { InferSelectModel } from 'drizzle-orm';
import { IAccountingPeriodHistory } from '../../../../domain/accounting/types/period-audit.types';
import { IAccountingPeriod } from '../../../../domain/accounting/types/period.types';
import { accountingPeriodHistoryInAudit } from '../../../config/drizzle/schema';
import { toRepoDate } from '../shared/date';

export interface IAccountingPeriodHistoryRepoModel extends InferSelectModel<
  typeof accountingPeriodHistoryInAudit
> {}

const accountingPeriodHistoryMapper = {
  toRepo(
    period: IAccountingPeriod,
    history: IAccountingPeriodHistory
  ): Omit<IAccountingPeriodHistoryRepoModel, 'id' | 'recordedAt'> {
    return {
      accountingPeriodId: history.entityId,
      accountingEntityId: period.accountingEntityId,
      actorType: history.actor.type,
      action: history.action,
      userId: history.actor.userId,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: toRepoDate(history.occurredAt),
    };
  },
};

export default accountingPeriodHistoryMapper;
