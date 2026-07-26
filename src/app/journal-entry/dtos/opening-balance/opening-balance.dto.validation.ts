import z from 'zod';
import journalEntryError from '../../../../domain/journal-entry/errors/journal-entry.error';
import ledgerError from '../../../../domain/ledger/shared/errors/ledger.error';
import { exchangeRateDtoValidation } from '../../../money/dtos/exchange-rate/exchange-rate.dto.validation';
import { moneyDtoValidation } from '../../../money/dtos/money/money.dto.validation';

export const openingBalanceDtoValidation = z.object({
  amount: moneyDtoValidation,
  exchangeRate: exchangeRateDtoValidation.nullable(),
  date: z
    .date(new journalEntryError.InvalidOpeningBalanceDate().errorKey)
    .refine((value) => value.getTime() <= Date.now(), {
      message: new journalEntryError.InvalidOpeningBalanceDate().errorKey,
    }),
});

export const openingBalanceCreationReqValidation = z.object({
  ...openingBalanceDtoValidation.shape,
  accountId: z.uuid(new ledgerError.InvalidId().errorKey),
});
