import z from 'zod';
import {
  exchangeRateDtoValidation,
  IExchangeRateDto,
  IMoneyDto,
  moneyDtoValidation,
} from './money.dto';

export interface IPettyCashAccountCreationReq {
  name: string;
  openingBalance: IMoneyDto;
  isControlAccount: boolean;
  exchangeRate: IExchangeRateDto;
  controlAccountCode?: string;
}
export const pettyCashCreationReqValidation = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters long'),
  openingBalance: moneyDtoValidation,
  isControlAccount: z.boolean(),
  exchangeRate: exchangeRateDtoValidation,
  controlAccountCode: z.string().optional(),
});
