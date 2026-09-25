import { InferSelectModel } from 'drizzle-orm';

import repoError from '@shared/values/errors/repo.error';

import { IFxCostBasisLotDispositionHistory } from '@domain/subledger/fx-cost-basis/types/disposition.types';

import { subledgerFxCostBasisLotDispositionHistoryInAudit } from '@infra/config/drizzle/schema';
import { toRepoDate } from '@infra/persistence/helpers/date.mapper';

export interface IFxCostBasisLotDispositionHistoryModel extends InferSelectModel<
  typeof subledgerFxCostBasisLotDispositionHistoryInAudit
> {}

const fxCostBasisLotDispositionHistoryMapper = {
  toRepo(
    history: IFxCostBasisLotDispositionHistory
  ): Omit<IFxCostBasisLotDispositionHistoryModel, 'id' | 'recordedAt'> {
    const accountingEntityId =
      history.diff.after?.accountingEntityId ??
      history.diff.before?.accountingEntityId;

    if (!accountingEntityId) {
      throw new repoError.MissingHistory({
        entity: 'disposition',
        field: 'accountingEntityId',
      });
    }

    return {
      dispositionId: history.entityId,
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

export default fxCostBasisLotDispositionHistoryMapper;
