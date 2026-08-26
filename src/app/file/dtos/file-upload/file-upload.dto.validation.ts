import z from 'zod';

import fileAttachmentError from '@shared/values/file-attachments/file-attachment.error';

const invalidNameKey = new fileAttachmentError.InvalidName().errorKey;
const invalidTypeKey = new fileAttachmentError.InvalidType().errorKey;
const invalidSizeKey = new fileAttachmentError.InvalidSize().errorKey;

export const fileUploadReqValidation = z.object({
  name: z.string(invalidNameKey).trim().min(1, invalidNameKey),
  type: z.string(invalidTypeKey).trim().min(1, invalidTypeKey),
  size: z.number(invalidSizeKey).positive(invalidSizeKey),
});
