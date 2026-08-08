import { InferSelectModel } from 'drizzle-orm';

import { IContractorHistory } from '@domain/counterparty/types/counterparty-audit.types';

import { counterpartyContractorHistoryInAudit } from '@infra/config/drizzle/schema';
import { toRepoDate } from '@infra/persistence/helpers/date.mapper';

export interface IContractorHistoryRepoModel extends InferSelectModel<
  typeof counterpartyContractorHistoryInAudit
> {}

const contractorHistoryMapper = {
  toRepo(
    history: IContractorHistory
  ): Omit<IContractorHistoryRepoModel, 'id' | 'recordedAt'> {
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

export default contractorHistoryMapper;
