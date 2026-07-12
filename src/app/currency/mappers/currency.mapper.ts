import {
  SYSTEM_CURRENCIES,
  UCurrencyCode,
} from '../../../domain/currency/config/currencies.config';
import currencyEntity from '../../../domain/currency/entities/currency.entity';
import { ICurrency } from '../../../domain/currency/types/currency.types';

const currencyMapper = {
  fromInterface(code: string): ICurrency {
    currencyEntity.validateCode(code);

    return SYSTEM_CURRENCIES[code as UCurrencyCode];
  },
};

export default currencyMapper;
