import z from 'zod';
import { exchangeRateDtoValidation } from '../../../money/dtos/exchange-rate/exchange-rate.dto.validation';
import { moneyDtoValidation } from '../../../money/dtos/money/money.dto.validation';

export const openingBalanceDtoValidation = z.object({
  amount: moneyDtoValidation,
  exchangeRate: exchangeRateDtoValidation.nullable(),
  date: z
    .date('Invalid opening balance date')
    .refine((value) => value.getTime() <= Date.now(), {
      message: 'Opening balance date cannot be in the future',
    }),
});

export const openingBalanceCreationReqValidation = z.object({
  ...openingBalanceDtoValidation.shape,
  accountId: z.uuid('Invalid account ID'),
});
