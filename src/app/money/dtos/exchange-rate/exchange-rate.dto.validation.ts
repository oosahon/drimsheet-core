import { omit } from 'lodash';
import z from 'zod';
import exchangeRateError from '../../../../domain/money/errors/exchange-rate.error';
import { EExchangeRateType } from '../../../../domain/money/types/exchange-rate.types';
import { paginationDtoValidation } from '../../../../shared/pagination/dto/pagination.dto.validation';
import { currencyCodeValidation } from '../currency/currency.dto.validation';

// TODO: enforce custom error for dto validations
export const currencyPairValidation = z
  .string()
  .regex(/^[A-Z]{3}\/[A-Z]{3}$/, 'Invalid currency pair');

export const exchangeRateDtoValidation = z.object({
  baseCurrencyCode: currencyCodeValidation,
  targetCurrencyCode: currencyCodeValidation,
  rate: z
    .number('Rate must be a valid number')
    .positive('Rate must be positive'),
  type: z.enum(EExchangeRateType),
  asOf: z.coerce.date(new exchangeRateError.InvalidDate().errorKey),
  source: z
    .string()
    .min(2, 'Invalid source: must be at least 2 characters')
    .max(100, 'Invalid source: must be at most 100 characters'),
});

export const exchangeRateQueryParamValidation = z.object({
  ...omit(paginationDtoValidation.shape, ['search', 'sortDirection']),
  currencyPair: currencyPairValidation,
  type: z.enum(EExchangeRateType).optional(),
  asOf: exchangeRateDtoValidation.shape.asOf.optional(),
});
