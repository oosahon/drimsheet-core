import { IMoneyDto } from '../../../app/money/dtos/money/money.dto';
import {
  SYSTEM_CURRENCIES,
  UCurrencyCode,
} from '../../../domain/money/config/currencies.config';
import currencyEntity from '../../../domain/money/entities/currency.entity';
import currencyError from '../../../domain/money/errors/currency.error';
import { IMoney } from '../../../domain/money/types/money.types';
import moneyValue from '../../../domain/money/values/money.vo';
import appError from '../../../shared/values/errors/app.error';

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
          message: new currencyError.InvalidCode().errorKey,
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
