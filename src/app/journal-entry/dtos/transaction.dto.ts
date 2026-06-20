import z from 'zod';
import journalEntryError from '../../../domain/journal-entry/errors/journal-entry.error';
import {
  UJournalEntrySourceType,
  UJournalEntryStatus,
} from '../../../domain/journal-entry/types/journal-entry.types';
import {
  IJournalLineReq,
  journalEntrySourceTypeValidation,
  journalEntryStatusValidation,
  journalLineReqValidation,
} from './journal-entry.dto';

export interface IJournalEntryReq {
  sourceLine: IJournalLineReq;
  // TODO: include counterparty when module is available
  sourceType: UJournalEntrySourceType;
  destinationLines: IJournalLineReq[];
  status: UJournalEntryStatus;
  effectiveDate: Date;
  postedAt: Date | null;
  memo: string | null;
}

export const journalEntryReqValidation = z.object({
  sourceLine: journalLineReqValidation,
  sourceType: journalEntrySourceTypeValidation,
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
