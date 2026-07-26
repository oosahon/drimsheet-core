import z from 'zod';
import assetAccountError from '../../../../domain/ledger/asset-account/errors/asset-account.error';
import ledgerAccountError from '../../../../domain/ledger/shared/errors/ledger-account.error';
import { openingBalanceDtoValidation } from '../../../journal-entry/dtos/opening-balance/opening-balance.dto.validation';
import { currencyCodeValidation } from '../../../money/dtos/currency/currency.dto.validation';

export const pettyCashCreationReqValidation = z
  .object({
    name: z
      .string()
      .min(1, new ledgerAccountError.InvalidName().errorKey)
      .max(100, new ledgerAccountError.InvalidName().errorKey),
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
      message: new assetAccountError.OpeningBalanceCurrencyMismatch().errorKey,
      path: ['openingBalance', 'amount', 'currencyCode'],
    }
  );
