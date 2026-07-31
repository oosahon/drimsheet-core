import { InferSelectModel } from 'drizzle-orm';
import { IFxCostBasisLotAcquisitionHistory } from '../../../../../domain/subledger/fx-cost-basis/types/acquisition.types';
import repoError from '../../../../../shared/values/errors/repo.error';
import { subledgerFxCostBasisLotAcquisitionHistoryInAudit } from '../../../../config/drizzle/schema';
import { toRepoDate } from '../../shared/date';

export interface IFxCostBasisLotAcquisitionHistoryModel extends InferSelectModel<
  typeof subledgerFxCostBasisLotAcquisitionHistoryInAudit
> {}

const fxCostBasisLotAcquisitionHistoryMapper = {
  toRepo(
    history: IFxCostBasisLotAcquisitionHistory
  ): Omit<IFxCostBasisLotAcquisitionHistoryModel, 'id' | 'recordedAt'> {
    const lotId = history.diff.after?.lotId ?? history.diff.before?.lotId;

    if (!lotId) {
      throw new repoError.MissingHistory({
        entity: 'acquisition',
        field: 'lotId',
      });
    }

    const accountingEntityId =
      history.diff.after?.accountingEntityId ??
      history.diff.before?.accountingEntityId;

    if (!accountingEntityId) {
      throw new repoError.MissingHistory({
        entity: 'acquisition',
        field: 'accountingEntityId',
      });
    }

    return {
      acquisitionId: history.entityId,
      lotId,
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

export default fxCostBasisLotAcquisitionHistoryMapper;
