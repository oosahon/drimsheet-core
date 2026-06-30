import z from 'zod';

export const currencyCodeValidation = z
  .string()
  .length(3, 'Invalid currency code');

export interface ICurrencyDto {
  code: string;
  symbol: string;
  name: string;
  minorUnit: number;
}

export const currencyDtoValidation = z.object({
  code: currencyCodeValidation,
  symbol: z.string(),
  name: z.string(),
  minorUnit: z.number(),
});
