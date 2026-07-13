// TODO: use standard errors

import z from 'zod';
import { currencyCodeValidation } from '../../../currency/dtos/currency/currency.dto.validation';

export const moneyDtoValidation = z.object({
  amount: z.number(),
  currencyCode: currencyCodeValidation,
  isMinorUnit: z.boolean('Specify if amount is in minor unit.'),
});
