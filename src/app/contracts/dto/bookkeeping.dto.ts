import z from 'zod';
import journalEntryError from '../../../domain/journal-entry/errors/journal-entry.error';
import { UJournalEntryStatus } from '../../../domain/journal-entry/types/journal-entry.types';
import {
  IJournalLineDto,
  journalEntryStatusValidation,
  journalLineDtoValidation,
} from './journal-entry.dto';
import {
  exchangeRateDtoValidation,
  IExchangeRateDto,
  IMoneyDto,
  moneyDtoValidation,
} from './money.dto';

export interface IOpeningBalanceDto {
  amount: IMoneyDto;
  exchangeRate: IExchangeRateDto | null;
}
export const openingBalanceDtoValidation = z.object({
  amount: moneyDtoValidation,
  exchangeRate: exchangeRateDtoValidation.nullable(),
});
export interface IOpeningBalanceCreationReq extends IOpeningBalanceDto {
  accountId: string;
}

export const openingBalanceCreationReqValidation = z.object({
  ...openingBalanceDtoValidation.shape,
  accountId: z.uuid('Invalid account ID'),
});

export interface ITransferTransactionReq {
  sourceLine: IJournalLineDto;
  destinationLines: IJournalLineDto[];
  status: UJournalEntryStatus;
  effectiveDate: Date;
  postedAt: Date | null;
  memo: string | null;
}

export const transferTransactionReqValidation = z.object({
  sourceLine: journalLineDtoValidation,
  destinationLines: z
    .array(journalLineDtoValidation)
    .min(1, 'At least one destination line is required'),
  status: journalEntryStatusValidation,
  effectiveDate: z.date(new journalEntryError.InvalidEffectiveDate().errorKey),
  postedAt: z
    .date(new journalEntryError.InvalidPostingDate().errorKey)
    .nullable(),
  memo: z.string(new journalEntryError.InvalidMemo().errorKey).nullable(),
});
