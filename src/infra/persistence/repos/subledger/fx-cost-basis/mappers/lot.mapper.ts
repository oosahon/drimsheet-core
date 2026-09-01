import { InferSelectModel } from 'drizzle-orm';

import { TEntityId } from '@shared/types/uuid';

import { IFxCostBasisLot } from '@domain/subledger/fx-cost-basis/types/lot.types';

import { subledgerFxCostBasisLotsInCore } from '@infra/config/drizzle/schema';
import {
  fromRepoDate,
  toRepoDate,
} from '@infra/persistence/helpers/date.mapper';
import moneyMapper from '@infra/persistence/helpers/money.mapper';
import exchangeRateMapper, {
  IExchangeRateModel,
} from '@infra/persistence/repos/money/mappers/exchange-rate.mapper';

export interface IFxCostBasisLotModel extends InferSelectModel<
  typeof subledgerFxCostBasisLotsInCore
> {}

const fxCostBasisLot = {
  toRepo(payload: IFxCostBasisLot): IFxCostBasisLotModel {
    return {
      id: payload.id as TEntityId,
      ledgerAccountId: payload.ledgerAccountId as TEntityId,
      accountingEntityId: payload.accountingEntityId as TEntityId,
      status: payload.status,
      originalQuantityAmount: moneyMapper.toRepo(payload.originalQuantity)
        .amount,
      originalQuantityCurrency: payload.originalQuantity.currency.code,
      remainingQuantityAmount: moneyMapper.toRepo(payload.remainingQuantity)
        .amount,
      costBasisAmount: moneyMapper.toRepo(payload.costBasis).amount,
      costBasisCurrency: payload.costBasis.currency.code,
      remainingCostBasisAmount: moneyMapper.toRepo(payload.remainingCostBasis)
        .amount,
      acquisitionRate: exchangeRateMapper.toRepo(payload.acquisitionRate),
      acquisitionDate: toRepoDate(payload.acquisitionDate),
      version: payload.version,
      createdAt: toRepoDate(payload.createdAt),
      updatedAt: toRepoDate(payload.updatedAt),
    };
  },

  toDomain(payload: IFxCostBasisLotModel): IFxCostBasisLot {
    return {
      id: payload.id as TEntityId,
      ledgerAccountId: payload.ledgerAccountId as TEntityId,
      accountingEntityId: payload.accountingEntityId as TEntityId,
      status: payload.status,
      originalQuantity: moneyMapper.fromRepo(
        payload.originalQuantityAmount,
        payload.originalQuantityCurrency
      ),
      remainingQuantity: moneyMapper.fromRepo(
        payload.remainingQuantityAmount,
        payload.originalQuantityCurrency
      ),
      costBasis: moneyMapper.fromRepo(
        payload.costBasisAmount,
        payload.costBasisCurrency
      ),
      remainingCostBasis: moneyMapper.fromRepo(
        payload.remainingCostBasisAmount,
        payload.costBasisCurrency
      ),
      acquisitionRate: exchangeRateMapper.toDomain(
        payload.acquisitionRate as IExchangeRateModel
      ),
      acquisitionDate: fromRepoDate(payload.acquisitionDate),
      version: payload.version,
      createdAt: fromRepoDate(payload.createdAt),
      updatedAt: fromRepoDate(payload.updatedAt),
    };
  },
};

export default fxCostBasisLot;
