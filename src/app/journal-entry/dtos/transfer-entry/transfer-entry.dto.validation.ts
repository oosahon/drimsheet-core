import z from 'zod';

import journalEntryError from '@domain/journal-entry/errors/journal-entry.error';

import fileAppError from '@app/file/errors/file.error';
import fileUploadPolicy from '@app/file/policies/file-upload.policy';
import { EFileUploadPurpose } from '@app/file/types/file.types';
import { journalLineReqValidation } from '@app/journal-entry/dtos/journal-entry/journal-entry.dto.validation';

const invalidAttachmentReferenceKey = new fileAppError.InvalidUploadReference()
  .errorKey;
const invalidUploadCountKey = new fileAppError.InvalidUploadCount().errorKey;
const maxAttachmentReferences = fileUploadPolicy.getPolicy(
  EFileUploadPurpose.JournalEntryAttachment
).maxFiles;

const transferEntryLineReqValidation = journalLineReqValidation.omit({
  counterparty: true,
});

export const transferEntryReqValidation = z.object({
  attachmentReferences: z
    .array(z.uuid(invalidAttachmentReferenceKey))
    .max(maxAttachmentReferences, invalidUploadCountKey)
    .refine(
      (references) => new Set(references).size === references.length,
      invalidAttachmentReferenceKey
    )
    .optional(),
  sourceLine: transferEntryLineReqValidation,
  destinationLine: transferEntryLineReqValidation,
  effectiveDate: z.date(new journalEntryError.InvalidEffectiveDate().errorKey),
  postedAt: z
    .date(new journalEntryError.InvalidPostingDate().errorKey)
    .nullable(),
  memo: z.string(new journalEntryError.InvalidMemo().errorKey).nullable(),
});
