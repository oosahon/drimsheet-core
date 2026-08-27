import z from 'zod';

import journalEntryError from '@domain/journal-entry/errors/journal-entry.error';
import journalLineError from '@domain/journal-entry/errors/journal-line.error';

import { counterpartyNameValidation } from '@app/counterparty/dtos/counterparty/counterparty.dto.validation';
import fileAppError from '@app/file/errors/file.error';
import { journalLineReqValidation } from '@app/journal-entry/dtos/journal-entry/journal-entry.dto.validation';

const invalidAttachmentReferenceKey = new fileAppError.InvalidUploadReference()
  .errorKey;

const receiptEntryLineReqValidation = journalLineReqValidation.extend({
  counterparty: z.object({
    id: z
      .uuid(new journalLineError.InvalidCounterpartyId().errorKey)
      .optional(),
    name: counterpartyNameValidation,
  }),
});

export const receiptEntryReqValidation = z.object({
  attachmentReferences: z
    .array(z.uuid(invalidAttachmentReferenceKey))
    .refine(
      (references) => new Set(references).size === references.length,
      invalidAttachmentReferenceKey
    )
    .optional(),
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
