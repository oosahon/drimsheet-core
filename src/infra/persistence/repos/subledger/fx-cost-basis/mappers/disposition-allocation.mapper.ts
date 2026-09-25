import { InferSelectModel } from 'drizzle-orm';

import { TEntityId } from '@shared/types/uuid';

import { IFxCostBasisLotDispositionAllocation } from '@domain/subledger/fx-cost-basis/types/disposition.types';

import { subledgerFxCostBasisLotDispositionAllocationsInCore } from '@infra/config/drizzle/schema';
import {
  fromRepoDate,
  toRepoDate,
} from '@infra/persistence/helpers/date.mapper';
import moneyMapper from '@infra/persistence/helpers/money.mapper';

export interface IFxCostBasisLotDispositionAllocationModel extends InferSelectModel<
  typeof subledgerFxCostBasisLotDispositionAllocationsInCore
> {}

const fxCostBasisLotDispositionAllocationMapper = {
  toDomain(
    payload: IFxCostBasisLotDispositionAllocationModel
  ): IFxCostBasisLotDispositionAllocation {
    return {
      createdBy: payload.createdBy as TEntityId,
      id: payload.id as TEntityId,
      dispositionId: payload.dispositionId as TEntityId,
      lotId: payload.lotId as TEntityId,
      quantity: moneyMapper.fromRepo(
        payload.quantityAmount,
        payload.quantityCurrency
      ),
      costBasisConsumed: moneyMapper.fromRepo(
        payload.costBasisConsumedAmount,
        payload.costBasisConsumedCurrency
      ),
      proceeds: moneyMapper.fromRepo(
        payload.proceedsAmount,
        payload.proceedsCurrency
      ),
      realizedGainLoss: moneyMapper.fromRepo(
        payload.realizedGainLossAmount,
        payload.realizedGainLossCurrency
      ),
      createdAt: fromRepoDate(payload.createdAt),
    };
  },

  toRepo(
    payload: IFxCostBasisLotDispositionAllocation
  ): IFxCostBasisLotDispositionAllocationModel {
    return {
      createdBy: payload.createdBy as TEntityId,
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
