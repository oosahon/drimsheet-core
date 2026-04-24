import { InferSelectModel } from 'drizzle-orm';
import { IExchangeRate } from '../../domain/currency/types/exchange-rate.types';
import { exchangeRatesInCore } from '../../infra/persistence/drizzle/schema';
import { fromRepoDate, toRepoDate } from './date';

interface IExchangeRateModel extends InferSelectModel<
  typeof exchangeRatesInCore
> {}

const exchangeRateMapper = {
  toRepo: (payload: IExchangeRate): Omit<IExchangeRateModel, 'id'> => {
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

  toDomain(payload: IExchangeRateModel): IExchangeRate {
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
