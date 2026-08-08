import z from 'zod';

import journalEntryError from '@domain/journal-entry/errors/journal-entry.error';

import {
  journalEntrySourceTypeValidation,
  journalEntryStatusValidation,
  journalLineReqValidation,
} from '@app/journal-entry/dtos/journal-entry/journal-entry.dto.validation';

export const journalEntryReqValidation = z.object({
  sourceLine: journalLineReqValidation,
  sourceType: journalEntrySourceTypeValidation,
  destinationLines: z
    .array(journalLineReqValidation)
    .min(1, new journalEntryError.InvalidLineItems().errorKey),
  status: journalEntryStatusValidation,
  effectiveDate: z.date(new journalEntryError.InvalidEffectiveDate().errorKey),
  postedAt: z
    .date(new journalEntryError.InvalidPostingDate().errorKey)
    .nullable(),
  memo: z.string(new journalEntryError.InvalidMemo().errorKey).nullable(),
});
