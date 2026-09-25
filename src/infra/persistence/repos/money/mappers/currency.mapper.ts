import { InferSelectModel } from 'drizzle-orm';

import { TEntityId } from '@shared/types/uuid';

import {
  SYSTEM_CURRENCIES,
  UCurrencyCode,
} from '@domain/money/config/currencies.config';
import currencyEntity from '@domain/money/entities/currency.entity';
import { ICurrency } from '@domain/money/types/currency.types';

import { currenciesInCore } from '@infra/config/drizzle/schema';

export interface ICurrencyModel extends InferSelectModel<
  typeof currenciesInCore
> {}

const currencyMapper = {
  toRepo(currency: ICurrency, createdBy: TEntityId): ICurrencyModel {
    return {
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      minorUnit: currency.minorUnit,
    };
  },

  toDomain(currency: ICurrencyModel): ICurrency {
    return {
      code: currency.code as UCurrencyCode,
      symbol: currency.symbol,
      name: currency.name,
      minorUnit: currency.minorUnit,
    };
  },

  fromInterface(code: string): ICurrency {
    currencyEntity.validateCode(code);

    return SYSTEM_CURRENCIES[code as UCurrencyCode];
  },
};

export default currencyMapper;
