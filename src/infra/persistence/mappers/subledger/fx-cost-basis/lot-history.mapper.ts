import { InferSelectModel } from 'drizzle-orm';
import { IFxCostBasisLotHistory } from '../../../../../domain/subledger/fx-cost-basis/types/lot.types';
import repoError from '../../../../../shared/values/errors/repo.error';
import { subledgerFxCostBasisLotHistoryInAudit } from '../../../../config/drizzle/schema';
import { toRepoDate } from '../../shared/date';

export interface IFxCostBasisLotHistoryModel extends InferSelectModel<
  typeof subledgerFxCostBasisLotHistoryInAudit
> {}

const fxCostBasisLotHistoryMapper = {
  toRepo(
    history: IFxCostBasisLotHistory
  ): Omit<IFxCostBasisLotHistoryModel, 'id' | 'recordedAt'> {
    const accountingEntityId =
      history.diff.after?.accountingEntityId ??
      history.diff.before?.accountingEntityId;

    if (!accountingEntityId) {
      throw new repoError.MissingHistory({
        entity: 'lot',
        field: 'accountingEntityId',
      });
    }

    return {
      lotId: history.entityId,
      accountingEntityId,
      actorType: history.actor.type,
      action: history.action,
      userId: history.actor.userId,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: toRepoDate(history.occurredAt),
    };
  },
};

export default fxCostBasisLotHistoryMapper;
