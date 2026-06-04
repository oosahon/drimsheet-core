import z from 'zod';
import { ULedgerAccountBalanceEffect } from '../../../domain/bookkeeping/types/ledger-account-balance.types';
import journalEntryError from '../../../domain/journal-entry/errors/journal-entry.error';
import { UJournalEntryStatus } from '../../../domain/journal-entry/types/journal-entry.types';
import {
  exchangeRateReqValidation,
  IExchangeRateReq,
  IMoneyDto,
  moneyDtoValidation,
} from '../../shared/dtos/money.dto';
import {
  IJournalHeaderDto,
  IJournalLineDto,
  IJournalLineReq,
  journalEntryStatusValidation,
  journalLineReqValidation,
} from './journal-entry.dto';

export interface IOpeningBalanceDto {
  amount: IMoneyDto;
  exchangeRate: IExchangeRateReq | null;
}
export const openingBalanceDtoValidation = z.object({
  amount: moneyDtoValidation,
  exchangeRate: exchangeRateReqValidation.nullable(),
});
export interface IOpeningBalanceCreationReq extends IOpeningBalanceDto {
  accountId: string;
}

export const openingBalanceCreationReqValidation = z.object({
  ...openingBalanceDtoValidation.shape,
  accountId: z.uuid('Invalid account ID'),
});

export interface ITransferTransactionReq {
  sourceLine: IJournalLineReq;
  destinationLines: IJournalLineReq[];
  status: UJournalEntryStatus;
  effectiveDate: Date;
  postedAt: Date | null;
  memo: string | null;
}

export const transferTransactionReqValidation = z.object({
  sourceLine: journalLineReqValidation,
  destinationLines: z
    .array(journalLineReqValidation)
    .min(1, 'At least one destination line is required'),
  status: journalEntryStatusValidation,
  effectiveDate: z.date(new journalEntryError.InvalidEffectiveDate().errorKey),
  postedAt: z
    .date(new journalEntryError.InvalidPostingDate().errorKey)
    .nullable(),
  memo: z.string(new journalEntryError.InvalidMemo().errorKey).nullable(),
});

export interface IAccountTransactionDto extends IJournalLineDto {
  header: IJournalHeaderDto;
}

export interface IAccountTransactionRes extends IAccountTransactionDto {
  balanceEffect: ULedgerAccountBalanceEffect;
}
