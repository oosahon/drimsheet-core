import z from 'zod';
import {
  EExchangeRateType,
  IExchangeRate,
} from '../../../domain/currency/types/exchange-rate.types';

const currencyCodeValidation = z.string().length(3, 'Invalid currency code');

export interface IMoneyDto {
  amount: number;
  currencyCode: string;
  isMinorUnit: boolean;
}
export const moneyDtoValidation = z.object({
  amount: z.number().min(1, 'Amount is required'),
  currencyCode: currencyCodeValidation,
  isMinorUnit: z.boolean('Specify if amount is in minor unit.'),
});

export interface IExchangeRateDto extends Pick<
  IExchangeRate,
  | 'baseCurrencyCode'
  | 'targetCurrencyCode'
  | 'rate'
  | 'type'
  | 'asOf'
  | 'source'
> {
  id?: number;
}
export const exchangeRateDtoValidation = z.object({
  id: z.number().optional(),
  baseCurrencyCode: currencyCodeValidation,
  targetCurrencyCode: currencyCodeValidation,
  rate: z
    .number('Rate must be a valid number')
    .positive('Rate must be positive'),
  type: z.enum(EExchangeRateType),
  asOf: z.string().transform((value) => new Date(value)),
  source: z
    .string()
    .min(2, 'Invalid source: must be at least 2 characters')
    .max(100, 'Invalid source: must be at most 100 characters'),
});
