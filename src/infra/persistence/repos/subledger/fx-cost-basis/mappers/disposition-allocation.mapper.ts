import { InferSelectModel } from 'drizzle-orm';

import { IFxCostBasisLotDispositionAllocation } from '@domain/subledger/fx-cost-basis/types/disposition.types';

import { subledgerFxCostBasisLotDispositionAllocationsInCore } from '@infra/config/drizzle/schema';
import { toRepoDate } from '@infra/persistence/helpers/date.mapper';
import moneyMapper from '@infra/persistence/helpers/money.mapper';

export interface IFxCostBasisLotDispositionAllocationModel extends InferSelectModel<
  typeof subledgerFxCostBasisLotDispositionAllocationsInCore
> {}

const fxCostBasisLotDispositionAllocationMapper = {
  toRepo(
    payload: IFxCostBasisLotDispositionAllocation
  ): IFxCostBasisLotDispositionAllocationModel {
    return {
      id: payload.id,
      dispositionId: payload.dispositionId,
      lotId: payload.lotId,
      quantityAmount: moneyMapper.toRepo(payload.quantity).amount,
      quantityCurrency: payload.quantity.currency.code,
      costBasisConsumedAmount: moneyMapper.toRepo(payload.costBasisConsumed)
        .amount,
      costBasisConsumedCurrency: payload.costBasisConsumed.currency.code,
      proceedsAmount: moneyMapper.toRepo(payload.proceeds).amount,
      proceedsCurrency: payload.proceeds.currency.code,
      realizedGainLossAmount: moneyMapper.toRepo(payload.realizedGainLoss)
        .amount,
      realizedGainLossCurrency: payload.realizedGainLoss.currency.code,
      createdAt: toRepoDate(payload.createdAt),
    };
  },
};

export default fxCostBasisLotDispositionAllocationMapper;
