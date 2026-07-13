import z from 'zod';

export const currencyCodeValidation = z
  .string()
  .length(3, 'Invalid currency code');

export const currencyDtoValidation = z.object({
  code: currencyCodeValidation,
  symbol: z.string(),
  name: z.string(),
  minorUnit: z.number(),
});
