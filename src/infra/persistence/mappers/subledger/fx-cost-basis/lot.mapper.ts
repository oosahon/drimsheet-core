import { InferSelectModel } from 'drizzle-orm';
import { IFxCostBasisLot } from '../../../../../domain/subledger/fx-cost-basis/types/lot.types';
import { subledgerFxCostBasisLotsInCore } from '../../../../config/drizzle/schema';
import { toRepoDate } from '../../shared/date';
import moneyMapper from '../../shared/money.mapper';

export interface IFxCostBasisLotModel extends InferSelectModel<
  typeof subledgerFxCostBasisLotsInCore
> {}

const fxCostBasisLot = {
  toRepo(payload: IFxCostBasisLot): IFxCostBasisLotModel {
    return {
      id: payload.id,
      ledgerAccountId: payload.ledgerAccountId,
      accountingEntityId: payload.accountingEntityId,
      status: payload.status,
      originalQuantityAmount: moneyMapper.toRepo(payload.originalQuantity)
        .amount,
      originalQuantityCurrency: payload.originalQuantity.currency.code,
      costBasisAmount: moneyMapper.toRepo(payload.costBasis).amount,
      costBasisCurrency: payload.costBasis.currency.code,
      remainingCostBasisAmount: moneyMapper.toRepo(payload.remainingCostBasis)
        .amount,
      acquisitionRate: payload.acquisitionRate.rate.toString(),
      version: payload.version,
      createdAt: toRepoDate(payload.createdAt),
      updatedAt: toRepoDate(payload.updatedAt),
    };
  },
};

export default fxCostBasisLot;
