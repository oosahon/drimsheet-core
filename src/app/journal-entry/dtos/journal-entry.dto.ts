import z from 'zod';
import { IExchangeRate } from '../../../domain/currency/types/exchange-rate.types';
import journalEntryError from '../../../domain/journal-entry/errors/journal-entry.error';
import journalLineError from '../../../domain/journal-entry/errors/journal-line.error';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
  UJournalEntrySourceType,
  UJournalEntryStatus,
} from '../../../domain/journal-entry/types/journal-entry.types';
import {
  EJournalSide,
  UJournalSide,
} from '../../../domain/journal-entry/types/journal-line.types';
import {
  exchangeRateReqValidation,
  IExchangeRateReq,
  IMoneyDto,
  moneyDtoValidation,
} from '../../shared/dtos/money.dto';

const accountIdError = new journalLineError.InvalidAccountId().errorKey;
const descriptionError = new journalLineError.InvalidDescription().errorKey;
const journalSideError = new journalLineError.InvalidSide().errorKey;
const sequenceOrderError = new journalLineError.InvalidSequenceOrder().errorKey;

const sourceTypeError = new journalEntryError.InvalidSourceType().errorKey;
const journalEntryStatusError = new journalEntryError.InvalidStatus().errorKey;

/**
 * Journal entry source type validation schema
 */
export const journalEntrySourceTypeValidation = z.enum(
  Object.values(EJournalEntrySourceType) as [
    UJournalEntrySourceType,
    ...UJournalEntrySourceType[],
  ],
  sourceTypeError
);

export const journalEntrySideValidation = z.enum(
  Object.values(EJournalSide) as [UJournalSide, ...UJournalSide[]],
  journalSideError
);

export const journalEntryStatusValidation = z.enum(
  Object.values(EJournalEntryStatus) as [
    UJournalEntryStatus,
    ...UJournalEntryStatus[],
  ],
  journalEntryStatusError
);

export interface IJournalLineReq {
  accountId: string;
  amount: IMoneyDto;
  exchangeRate: IExchangeRateReq | null;
  description: string | null;
  sequenceOrder: number;
}

export const journalLineReqValidation = z.object({
  accountId: z.uuid(accountIdError),
  amount: moneyDtoValidation,
  exchangeRate: exchangeRateReqValidation.nullable(),
  description: z
    .string(descriptionError)
    .max(100, descriptionError)
    .min(1, descriptionError)
    .nullable(),
  sequenceOrder: z.number(sequenceOrderError).int().positive(),
});

export interface IJournalLineDto {
  id: string;
  entryId: string;
  accountId: string;
  sequenceOrder: number;
  amount: IMoneyDto;
  exchangeRate: IExchangeRate | null;
  functionalAmount: IMoneyDto;
  side: UJournalSide;
  description: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJournalHeaderDto {
  sourceType: UJournalEntrySourceType;
  counterpartyId: string | null;
  memo: string | null;
  status: UJournalEntryStatus;
  effectiveDate: Date;
  postedAt: Date | null;
  voidedAt: Date | null;
  voidingEntryId: string | null;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJournalEntryDto extends IJournalHeaderDto {
  id: string;
  accountingEntityId: string;
  lines: IJournalLineDto[];
}
