import z from 'zod';
import {
  exchangeRateDtoValidation,
  IExchangeRateDto,
  IMoneyDto,
  moneyDtoValidation,
} from './money.dto';

export interface IOpeningBalanceDto {
  amount: IMoneyDto;
  exchangeRate: IExchangeRateDto | null;
}
export const openingBalanceDtoValidation = z.object({
  amount: moneyDtoValidation,
  exchangeRate: exchangeRateDtoValidation.nullable(),
});
export interface IOpeningBalanceCreationReq extends IOpeningBalanceDto {
  accountId: string;
}

export const openingBalanceCreationReqValidation = z.object({
  ...openingBalanceDtoValidation.shape,
  accountId: z.uuid('Invalid account ID'),
});
