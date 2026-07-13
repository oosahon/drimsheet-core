import {
  SYSTEM_CURRENCIES,
  UCurrencyCode,
} from '../../../../domain/currency/config/currencies.config';
import currencyEntity from '../../../../domain/currency/entities/currency.entity';
import { IMoney } from '../../../../shared/types/money.types';
import moneyValue from '../../../../shared/value-objects/money.vo';
import appError from '../../errors/app.error';
import { IMoneyDto } from './money.dto';

const moneyMapper = {
  toDto(money: IMoney): IMoneyDto {
    return {
      amount: Number(money.amount),
      currencyCode: money.currency.code,
      isMinorUnit: true,
    };
  },

  fromDto(money: IMoneyDto): IMoney {
    const isValid = currencyEntity.isValidCode(money.currencyCode);

    if (!isValid) {
      throw new appError.UnprocessableEntity([
        {
          field: 'currencyCode',
          message: 'Invalid currency code',
        },
      ]);
    }

    const currency = SYSTEM_CURRENCIES[money.currencyCode as UCurrencyCode];
    return moneyValue.make(money.amount, currency, !!money.isMinorUnit);
  },
};

export default moneyMapper;
