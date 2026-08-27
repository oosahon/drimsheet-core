import z from 'zod';

import fileAttachmentError from '@shared/values/file-attachments/file-attachment.error';

import fileAppError from '@app/file/errors/file.error';
import { EFileUploadPurpose } from '@app/file/types/file.types';

const invalidNameKey = new fileAttachmentError.InvalidName().errorKey;
const invalidTypeKey = new fileAttachmentError.InvalidType().errorKey;
const invalidSizeKey = new fileAttachmentError.InvalidSize().errorKey;
const invalidPurposeKey = new fileAppError.InvalidUploadPurpose().errorKey;

const fileUploadValidation = z.object({
  name: z
    .string(invalidNameKey)
    .refine((name) => name.trim().length > 0, invalidNameKey),
  type: z.string(invalidTypeKey).trim().min(1, invalidTypeKey),
  size: z.number(invalidSizeKey).positive(invalidSizeKey),
  purpose: z.enum(EFileUploadPurpose, invalidPurposeKey),
});

export const fileUploadReqValidation = z.array(fileUploadValidation);
