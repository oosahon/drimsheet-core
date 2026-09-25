import { InferSelectModel } from 'drizzle-orm';

import { TEntityId } from '@shared/types/uuid';

import { IFxCostBasisLotDisposition } from '@domain/subledger/fx-cost-basis/types/disposition.types';

import { subledgerFxCostBasisLotDispositionsInCore } from '@infra/config/drizzle/schema';
import {
  fromRepoDate,
  toRepoDate,
  toRepoDateOnly,
} from '@infra/persistence/helpers/date.mapper';
import moneyMapper from '@infra/persistence/helpers/money.mapper';
import exchangeRateMapper, {
  IExchangeRateModel,
} from '@infra/persistence/repos/money/mappers/exchange-rate.mapper';

export interface IFxCostBasisLotDispositionModel extends InferSelectModel<
  typeof subledgerFxCostBasisLotDispositionsInCore
> {}

const fxCostBasisLotDispositionMapper = {
  toDomain(
    payload: IFxCostBasisLotDispositionModel
  ): IFxCostBasisLotDisposition {
    return {
      createdBy: payload.createdBy as TEntityId,
      id: payload.id as TEntityId,
      ledgerAccountId: payload.ledgerAccountId as TEntityId,
      accountingEntityId: payload.accountingEntityId as TEntityId,
      journalEntryId: payload.journalEntryId as TEntityId,
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
      dispositionRate: exchangeRateMapper.toDomain(
        payload.dispositionRate as IExchangeRateModel
      ),
      officialRate: payload.officialRate
        ? exchangeRateMapper.toDomain(
            payload.officialRate as IExchangeRateModel
          )
        : null,
      dispositionDate: fromRepoDate(payload.dispositionDate),
      createdAt: fromRepoDate(payload.createdAt),
    };
  },

  toRepo(payload: IFxCostBasisLotDisposition): IFxCostBasisLotDispositionModel {
    return {
      createdBy: payload.createdBy as TEntityId,
      id: payload.id,
      ledgerAccountId: payload.ledgerAccountId,
      accountingEntityId: payload.accountingEntityId,
      journalEntryId: payload.journalEntryId,
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
      dispositionRate: payload.dispositionRate,
      officialRate: payload.officialRate
        ? exchangeRateMapper.toEmbedded(payload.officialRate)
        : null,
      dispositionDate: toRepoDateOnly(payload.dispositionDate),
      createdAt: toRepoDate(payload.createdAt),
    };
  },
};

export default fxCostBasisLotDispositionMapper;
