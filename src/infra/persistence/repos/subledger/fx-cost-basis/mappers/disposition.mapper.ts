import { InferSelectModel } from 'drizzle-orm';

import { IFxCostBasisLotDisposition } from '@domain/subledger/fx-cost-basis/types/disposition.types';

import { subledgerFxCostBasisLotDispositionsInCore } from '@infra/config/drizzle/schema';
import {
  toRepoDate,
  toRepoDateOnly,
} from '@infra/persistence/helpers/date.mapper';
import moneyMapper from '@infra/persistence/helpers/money.mapper';
import exchangeRateMapper from '@infra/persistence/repos/money/mappers/exchange-rate.mapper';

export interface IFxCostBasisLotDispositionModel extends InferSelectModel<
  typeof subledgerFxCostBasisLotDispositionsInCore
> {}

const fxCostBasisLotDispositionMapper = {
  toRepo(payload: IFxCostBasisLotDisposition): IFxCostBasisLotDispositionModel {
    return {
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
        ? exchangeRateMapper.toRepo(payload.officialRate)
        : null,
      dispositionDate: toRepoDateOnly(payload.dispositionDate),
      createdAt: toRepoDate(payload.createdAt),
    };
  },
};

export default fxCostBasisLotDispositionMapper;
