import z from 'zod';
import { IMoneyDto, moneyDtoValidation } from './money.dto';

export interface IPettyCashAccountCreationReq {
  name: string;
  openingBalance: IMoneyDto;
  isControlAccount: boolean;
  controlAccountCode?: string;
}
export const pettyCashCreationReqValidation = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters long'),
  openingBalance: moneyDtoValidation,
  isControlAccount: z.boolean(),
  controlAccountId: z.string().optional(),
});
