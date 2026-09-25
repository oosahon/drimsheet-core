import { InferSelectModel } from 'drizzle-orm';

import repoError from '@shared/values/errors/repo.error';

import { IFxCostBasisLotHistory } from '@domain/subledger/fx-cost-basis/types/lot.types';

import { subledgerFxCostBasisLotHistoryInAudit } from '@infra/config/drizzle/schema';
import { toRepoDate } from '@infra/persistence/helpers/date.mapper';

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
      action: history.action,
      actorId: history.actorId,
      onBehalfOf: history.onBehalfOf,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: toRepoDate(history.occurredAt),
    };
  },
};

export default fxCostBasisLotHistoryMapper;
