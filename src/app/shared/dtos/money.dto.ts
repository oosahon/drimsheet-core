// TODO: use standard errors

import z from 'zod';
import { currencyCodeValidation } from '../../currency/dtos/currency.dto';

export interface IMoneyDto {
  amount: number;
  currencyCode: string;
  isMinorUnit: boolean;
}
export const moneyDtoValidation = z.object({
  amount: z.number(),
  currencyCode: currencyCodeValidation,
  isMinorUnit: z.boolean('Specify if amount is in minor unit.'),
});
