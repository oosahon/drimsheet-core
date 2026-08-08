import { InferSelectModel } from 'drizzle-orm';

import { IEmployerHistory } from '@domain/counterparty/types/counterparty-audit.types';

import { counterpartyEmployerHistoryInAudit } from '@infra/config/drizzle/schema';
import { toRepoDate } from '@infra/persistence/helpers/date.mapper';

export interface IEmployerHistoryRepoModel extends InferSelectModel<
  typeof counterpartyEmployerHistoryInAudit
> {}

const employerHistoryMapper = {
  toRepo(
    history: IEmployerHistory
  ): Omit<IEmployerHistoryRepoModel, 'id' | 'recordedAt'> {
    return {
      counterpartyId: history.entityId,
      actorType: history.actor.type,
      action: history.action,
      userId: history.actor.userId,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: toRepoDate(history.occurredAt),
    };
  },
};

export default employerHistoryMapper;
