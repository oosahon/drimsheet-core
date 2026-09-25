import { InferSelectModel } from 'drizzle-orm';

import { TEntityId } from '@shared/types/uuid';

import { IExchangeRate } from '@domain/money/types/exchange-rate.types';

import { currencyExchangeRatesInCore } from '@infra/config/drizzle/schema';
import {
  fromRepoDate,
  toRepoDate,
} from '@infra/persistence/helpers/date.mapper';

export interface IExchangeRateModel extends InferSelectModel<
  typeof currencyExchangeRatesInCore
> {}

const exchangeRateMapper = {
  toRepo: (
    payload: IExchangeRate,
    createdBy: TEntityId
  ): Omit<IExchangeRateModel, 'id'> => {
    return {
      createdBy,
      currencyPair: payload.currencyPair,
      baseCurrencyCode: payload.baseCurrencyCode,
      targetCurrencyCode: payload.targetCurrencyCode,
      rate: payload.rate.toString(),
      type: payload.type,
      asOf: toRepoDate(payload.asOf),
      source: payload.source,
      createdAt: toRepoDate(payload.createdAt),
    };
  },

  toEmbedded: (
    payload: IExchangeRate
  ): Omit<IExchangeRateModel, 'id' | 'createdBy'> => {
    return {
      currencyPair: payload.currencyPair,
      baseCurrencyCode: payload.baseCurrencyCode,
      targetCurrencyCode: payload.targetCurrencyCode,
      rate: payload.rate.toString(),
      type: payload.type,
      asOf: toRepoDate(payload.asOf),
      source: payload.source,
      createdAt: toRepoDate(payload.createdAt),
    };
  },

  toDomain(
    payload: Omit<IExchangeRateModel, 'id' | 'createdBy'>
  ): IExchangeRate {
    return {
      currencyPair: payload.currencyPair,
      baseCurrencyCode: payload.baseCurrencyCode,
      targetCurrencyCode: payload.targetCurrencyCode,
      rate: Number(payload.rate),
      type: payload.type,
      asOf: fromRepoDate(payload.asOf),
      source: payload.source,
      createdAt: fromRepoDate(payload.createdAt),
    };
  },
};

export default exchangeRateMapper;
