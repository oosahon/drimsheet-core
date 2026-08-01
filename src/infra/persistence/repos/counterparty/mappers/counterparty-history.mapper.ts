import { InferSelectModel } from 'drizzle-orm';
import { ICounterpartyHistory } from '../../../../../domain/counterparty/types/counterparty-audit.types';
import { ICounterparty } from '../../../../../domain/counterparty/types/counterparty.types';
import { counterpartyHistoryInAudit } from '../../../../config/drizzle/schema';
import { toRepoDate } from '../../../helpers/date.mapper';

export interface ICounterpartyHistoryRepoModel extends InferSelectModel<
  typeof counterpartyHistoryInAudit
> {}

const counterpartyHistoryMapper = {
  toRepo(
    counterparty: ICounterparty,
    history: ICounterpartyHistory
  ): Omit<ICounterpartyHistoryRepoModel, 'id' | 'recordedAt'> {
    return {
      counterpartyId: history.entityId,
      accountingEntityId: counterparty.accountingEntityId,
      actorType: history.actor.type,
      action: history.action,
      userId: history.actor.userId,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: toRepoDate(history.occurredAt),
    };
  },
};

export default counterpartyHistoryMapper;
