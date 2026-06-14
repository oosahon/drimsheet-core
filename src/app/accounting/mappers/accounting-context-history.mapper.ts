import { InferSelectModel } from 'drizzle-orm';
import { IAccountingContextHistory } from '../../../domain/accounting/types/accounting-context-audit.types';
import { IAccountingContext } from '../../../domain/accounting/types/context.types';
import { accountingContextHistoryInAudit } from '../../../infra/config/drizzle/schema';
import { toRepoDate } from '../../shared/mappers/date';

export interface IAccountingContextHistoryRepoModel extends InferSelectModel<
  typeof accountingContextHistoryInAudit
> {}

const accountingContextHistoryMapper = {
  toRepo(
    accountingContext: IAccountingContext,
    history: IAccountingContextHistory
  ): Omit<IAccountingContextHistoryRepoModel, 'id' | 'recordedAt'> {
    return {
      accountingContextId: history.entityId,
      accountingEntityId: accountingContext.accountingEntityId,
      actorType: history.actor.type,
      action: history.action,
      userId: history.actor.userId,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: toRepoDate(history.occurredAt),
    };
  },
};

export default accountingContextHistoryMapper;
