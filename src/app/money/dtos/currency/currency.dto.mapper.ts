import {
  SYSTEM_CURRENCIES,
  UCurrencyCode,
} from '@domain/money/config/currencies.config';
import currencyEntity from '@domain/money/entities/currency.entity';
import { ICurrency } from '@domain/money/types/currency.types';

const currencyMapper = {
  fromInterface(code: string): ICurrency {
    currencyEntity.validateCode(code);

    return SYSTEM_CURRENCIES[code as UCurrencyCode];
  },
};

export default currencyMapper;
