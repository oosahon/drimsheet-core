import { InferSelectModel } from 'drizzle-orm';
import { SYSTEM_CURRENCIES } from '../../domain/currency/config/currencies.config';
import { ICurrency } from '../../domain/currency/types/currency.types';
import { currenciesInCore } from '../../infra/config/drizzle/schema';

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

  fromInterface(code: string): ICurrency | undefined {
    return SYSTEM_CURRENCIES.find((currency) => currency.code === code);
  },
};

export default currencyMapper;
