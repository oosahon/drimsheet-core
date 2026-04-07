import { IMoney } from '../../shared/types/money.types';
import { AppError } from '../../shared/value-objects/error';
import { SYSTEM_CURRENCIES } from '../../domain/currency/config/currencies';
import { IMoneyDto } from '../contracts/dto/money.dto';

const moneyMapper = {
  toDto(money: IMoney): IMoneyDto {
    return {
      amount: Number(money.amount),
      currency: money.currency.code,
    };
  },

  fromDto(money: IMoneyDto): IMoney {
    const currency = SYSTEM_CURRENCIES.find((c) => c.code === money.currency);
    if (!currency) {
      throw new AppError('Currency not found', { cause: money.currency });
    }
    return {
      amount: BigInt(money.amount),
      currency,
    };
  },
};

export default moneyMapper;
