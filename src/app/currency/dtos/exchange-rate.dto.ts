import z from 'zod';
import {
  EExchangeRateType,
  UExchangeRateType,
} from '../../../domain/currency/types/exchange-rate.types';
import { currencyCodeValidation } from './currency.dto';

export interface IExchangeRateDto {
  baseCurrencyCode: string;
  targetCurrencyCode: string;
  rate: number;
  type: UExchangeRateType;
  asOf: Date;
  source: string;
}
export const exchangeRateDtoValidation = z.object({
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
