import z from 'zod';
import {
  exchangeRateReqValidation,
  IExchangeRateReq,
  IMoneyDto,
  moneyDtoValidation,
} from '../../shared/dtos/money.dto';

export interface IOpeningBalanceDto {
  amount: IMoneyDto;
  exchangeRate: IExchangeRateReq | null;
}
export const openingBalanceDtoValidation = z.object({
  amount: moneyDtoValidation,
  exchangeRate: exchangeRateReqValidation.nullable(),
});
export interface IOpeningBalanceCreationReq extends IOpeningBalanceDto {
  accountId: string;
}

export const openingBalanceCreationReqValidation = z.object({
  ...openingBalanceDtoValidation.shape,
  accountId: z.uuid('Invalid account ID'),
});
