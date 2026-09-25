import { InferSelectModel } from 'drizzle-orm';

import { IAccountingEntityAuditHistory } from '@domain/accounting/types/accounting-entity-audit.types';

import { accountingEntityHistoryInAudit } from '@infra/config/drizzle/schema';
import { toRepoDate } from '@infra/persistence/helpers/date.mapper';

export interface IAccountingEntityHistoryRepoModel extends InferSelectModel<
  typeof accountingEntityHistoryInAudit
> {}

const accountingEntityHistoryMapper = {
  toRepo(
    history: IAccountingEntityAuditHistory
  ): Omit<IAccountingEntityHistoryRepoModel, 'id' | 'recordedAt'> {
    return {
      accountingEntityId: history.entityId,
      action: history.action,
      actorId: history.actorId,
      onBehalfOf: history.onBehalfOf,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: toRepoDate(history.occurredAt),
    };
  },
};

export default accountingEntityHistoryMapper;
