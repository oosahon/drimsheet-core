import { SYSTEM_CURRENCIES } from '../../domain/currency/config/currencies.config';
import currencyEntity from '../../domain/currency/entities/currency.entity';
import { IMoney } from '../../shared/types/money.types';
import { ErrorUnprocessableEntity } from '../../shared/value-objects/error';
import moneyValue from '../../shared/value-objects/money.vo';
import { IMoneyDto } from '../contracts/dto/money.dto';

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

    const validationError = new ErrorUnprocessableEntity(
      [
        {
          field: 'currencyCode',
          message: 'Invalid currency code',
        },
      ],
      'Invalid currency provided.'
    );

    if (!isValid) {
      throw validationError;
    }

    const currency = SYSTEM_CURRENCIES[money.currencyCode];

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
