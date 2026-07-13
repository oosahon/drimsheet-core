import { IMoneyDto } from '../../../../app/shared/dtos/money/money.dto';
import appError from '../../../../app/shared/errors/app.error';
import {
  SYSTEM_CURRENCIES,
  UCurrencyCode,
} from '../../../../domain/currency/config/currencies.config';
import currencyEntity from '../../../../domain/currency/entities/currency.entity';
import { IMoney } from '../../../../shared/types/money.types';
import moneyValue from '../../../../shared/value-objects/money.vo';

const moneyMapper = {
  toDto(money: IMoney): IMoneyDto {
    return {
      amount: Number(money.amount),
      currencyCode: money.currency.code,
      isMinorUnit: true,
    };
  },

  fromRepo(amount: number, currencyCode: string): IMoney {
    const currency = currencyEntity.getByCode(currencyCode);
    return moneyValue.make(amount, currency, true);
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

  toRepo(money: IMoney) {
    return {
      amount: Number(money.amount),
      currencyCode: money.currency.code,
    };
  },
};

export default moneyMapper;
