import z from 'zod';
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
  exchangeRateDtoValidation,
  IExchangeRateDto,
  IMoneyDto,
  moneyDtoValidation,
} from './money.dto';

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

export interface IJournalLineDto {
  accountId: string;
  amount: IMoneyDto;
  exchangeRate: IExchangeRateDto | null;
  description: string | null;
  side: UJournalSide;
  sequenceOrder: number;
}

export const journalLineDtoValidation = z.object({
  accountId: z.uuid(accountIdError),
  amount: moneyDtoValidation,
  exchangeRate: exchangeRateDtoValidation.nullable(),
  description: z
    .string(descriptionError)
    .max(100, descriptionError)
    .min(1, descriptionError)
    .nullable(),
  side: journalEntrySideValidation,
  sequenceOrder: z.number(sequenceOrderError).int().positive(),
});
