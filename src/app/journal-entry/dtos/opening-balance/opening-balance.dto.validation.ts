import z from 'zod';
import { exchangeRateDtoValidation } from '../../../currency/dtos/exchange-rate/exchange-rate.dto.validation';
import { moneyDtoValidation } from '../../../shared/dtos/money/money.dto.validation';

export const openingBalanceDtoValidation = z.object({
  amount: moneyDtoValidation,
  exchangeRate: exchangeRateDtoValidation.nullable(),
});

export const openingBalanceCreationReqValidation = z.object({
  ...openingBalanceDtoValidation.shape,
  accountId: z.uuid('Invalid account ID'),
});
