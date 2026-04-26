import z from 'zod';
import {
  IOpeningBalanceCreationReq,
  openingBalanceCreationReqValidation,
} from './accounting.dto';
import { currencyCodeValidation } from './money.dto';

export interface IPettyCashAccountCreationReq {
  name: string;
  currencyCode: string;
  isControlAccount: boolean;
  controlAccountCode?: string;

  openingBalance: Omit<IOpeningBalanceCreationReq, 'accountId'> | null;
}
export const pettyCashCreationReqValidation = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be at most 100 characters long'),
    currencyCode: currencyCodeValidation,
    isControlAccount: z.boolean(),
    controlAccountCode: z.string().optional(),

    openingBalance: openingBalanceCreationReqValidation
      .omit({ accountId: true })
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.openingBalance) {
        return data.openingBalance.amount.currencyCode === data.currencyCode;
      }
      return true;
    },
    {
      message: 'Opening balance currency must match account currency',
      path: ['openingBalance', 'amount', 'currencyCode'],
    }
  );
