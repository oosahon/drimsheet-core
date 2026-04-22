import z from 'zod';

export interface IMoneyDto {
  amount: number;
  currency: string;
}

export const moneyDtoValidation = z.object({
  amount: z.number().min(1, 'Amount is required'),
  currency: z.string().length(3, 'Invalid currency code'),
});
