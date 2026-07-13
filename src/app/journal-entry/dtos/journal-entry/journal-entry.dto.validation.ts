import z from 'zod';
import journalEntryError from '../../../../domain/journal-entry/errors/journal-entry.error';
import journalLineError from '../../../../domain/journal-entry/errors/journal-line.error';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
  UJournalEntrySourceType,
  UJournalEntryStatus,
} from '../../../../domain/journal-entry/types/journal-entry.types';
import {
  EJournalSide,
  UJournalSide,
} from '../../../../domain/journal-entry/types/journal-line.types';
import { exchangeRateDtoValidation } from '../../../money/dtos/exchange-rate/exchange-rate.dto.validation';
import { moneyDtoValidation } from '../../../money/dtos/money/money.dto.validation';

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

export const journalLineReqValidation = z.object({
  accountId: z.uuid(accountIdError),
  amount: moneyDtoValidation,
  exchangeRate: exchangeRateDtoValidation.nullable(),
  description: z
    .string(descriptionError)
    .max(100, descriptionError)
    .min(1, descriptionError)
    .nullable(),
  sequenceOrder: z.number(sequenceOrderError).int().positive(),
});
