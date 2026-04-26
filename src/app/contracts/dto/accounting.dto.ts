import z from 'zod';
import {
  exchangeRateDtoValidation,
  IExchangeRateDto,
  IMoneyDto,
  moneyDtoValidation,
} from './money.dto';

export interface IOpeningBalanceCreationReq {
  amount: IMoneyDto;
  exchangeRate: IExchangeRateDto | null;
  accountId: string;
}
export const openingBalanceCreationReqValidation = z.object({
  amount: moneyDtoValidation,
  exchangeRate: exchangeRateDtoValidation.nullable(),
  accountId: z.uuid('Invalid account ID'),
});
