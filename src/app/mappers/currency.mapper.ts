import { InferSelectModel } from 'drizzle-orm';
import { ICurrency } from '../../domain/currency/types/currency.types';
import { currenciesInCore } from '../../infra/persistence/drizzle/schema';

export interface ICurrencyModel extends InferSelectModel<
  typeof currenciesInCore
> {}

const currencyMapper = {
  toRepo(currency: ICurrency): ICurrencyModel {
    return {
      ...currency,
      minorUnit: Number(currency.minorUnit),
    } as ICurrencyModel;
  },

  toDomain(currency: ICurrencyModel): ICurrency {
    return {
      code: currency.code,
      symbol: currency.symbol,
      name: currency.name,
      minorUnit: BigInt(currency.minorUnit),
    };
  },
};

export default currencyMapper;
