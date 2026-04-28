import { InferSelectModel } from 'drizzle-orm';
import {
  SYSTEM_CURRENCIES,
  UCurrencyCode,
} from '../../domain/currency/config/currencies.config';
import { ICurrency } from '../../domain/currency/types/currency.types';
import { currenciesInCore } from '../../infra/config/drizzle/schema';
import { ErrorBadRequest } from '../../shared/errors/error';

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
      code: currency.code as UCurrencyCode,
      symbol: currency.symbol,
      name: currency.name,
      minorUnit: BigInt(currency.minorUnit),
    };
  },

  fromInterface(code: string): ICurrency {
    const currency = SYSTEM_CURRENCIES[code as UCurrencyCode];

    if (!currency) {
      throw new ErrorBadRequest(`Currency ${code} does not exist`);
    }

    return currency;
  },
};

export default currencyMapper;
