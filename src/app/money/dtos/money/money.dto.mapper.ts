import {
  SYSTEM_CURRENCIES,
  UCurrencyCode,
} from '../../../../domain/money/config/currencies.config';
import currencyEntity from '../../../../domain/money/entities/currency.entity';
import { IMoney } from '../../../../domain/money/types/money.types';
import moneyValue from '../../../../domain/money/values/money.vo';
import appError from '../../../../shared/errors/app.error';
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
