import z from 'zod';
import assetAccountError from '../../../../domain/ledger/asset-account/errors/asset-account.error';
import ledgerAccountError from '../../../../domain/ledger/shared/errors/ledger-account.error';
import { openingBalanceDtoValidation } from '../../../journal-entry/dtos/opening-balance/opening-balance.dto.validation';
import { currencyCodeValidation } from '../../../money/dtos/currency/currency.dto.validation';

import ledgerError from '../../../../domain/ledger/shared/errors/ledger.error';

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

export const bankAccountCreationReqValidation = z
  .object({
    name: z
      .string()
      .min(1, new ledgerAccountError.InvalidName().errorKey)
      .max(100, new ledgerAccountError.InvalidName().errorKey),
    currencyCode: currencyCodeValidation,
    controlAccountCode: z
      .string()
      .length(6, new ledgerAccountError.InvalidCode().errorKey)
      .optional(),
    bankAccount: z
      .object({
        bankName: z
          .string()
          .min(2, new ledgerError.InvalidValue().errorKey)
          .max(100, new ledgerError.InvalidValue().errorKey),
        accountName: z
          .string()
          .min(2, new ledgerError.InvalidValue().errorKey)
          .max(100, new ledgerError.InvalidValue().errorKey),
        accountNumber: z
          .string()
          .min(6, new ledgerError.InvalidValue().errorKey)
          .max(34, new ledgerError.InvalidValue().errorKey),
      })
      .strict(),
    openingBalance: openingBalanceDtoValidation.nullable(),
  })
  .strict()
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
