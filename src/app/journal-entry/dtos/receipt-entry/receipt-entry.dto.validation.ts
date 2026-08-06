import z from 'zod';
import journalEntryError from '../../../../domain/journal-entry/errors/journal-entry.error';
import journalLineError from '../../../../domain/journal-entry/errors/journal-line.error';
import { counterpartyNameValidation } from '../../../counterparty/dtos/counterparty/counterparty.dto.validation';
import { journalLineReqValidation } from '../journal-entry/journal-entry.dto.validation';

export const receiptEntryLineReqValidation = journalLineReqValidation.extend({
  counterparty: z.object({
    id: z
      .uuid(new journalLineError.InvalidCounterpartyId().errorKey)
      .optional(),
    name: counterpartyNameValidation,
  }),
});

export const receiptEntryReqValidation = z.object({
  sourceLine: receiptEntryLineReqValidation,
  destinationLines: z
    .array(receiptEntryLineReqValidation)
    .min(1, new journalEntryError.InvalidLineItems().errorKey),
  effectiveDate: z.date(new journalEntryError.InvalidEffectiveDate().errorKey),
  postedAt: z
    .date(new journalEntryError.InvalidPostingDate().errorKey)
    .nullable(),
  memo: z.string(new journalEntryError.InvalidMemo().errorKey).nullable(),
});
