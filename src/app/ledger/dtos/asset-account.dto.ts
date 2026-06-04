import z from 'zod';
import {
  IOpeningBalanceDto,
  openingBalanceDtoValidation,
} from '../../bookkeeping/dtos/bookkeeping.dto';
import { currencyCodeValidation } from '../../shared/dtos/money.dto';

export interface IPettyCashAccountCreationReq {
  name: string;
  currencyCode: string;
  isControlAccount: boolean;
  controlAccountCode?: string;

  openingBalance: IOpeningBalanceDto | null;
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

    openingBalance: openingBalanceDtoValidation.nullable(),
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
