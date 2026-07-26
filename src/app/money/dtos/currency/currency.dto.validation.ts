import z from 'zod';
import currencyError from '../../../../domain/money/errors/currency.error';

export const currencyCodeValidation = z
  .string()
  .length(3, new currencyError.InvalidCode().errorKey);

export const currencyDtoValidation = z.object({
  code: currencyCodeValidation,
  symbol: z.string(),
  name: z.string(),
  minorUnit: z.number(),
});
