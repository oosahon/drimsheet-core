import stringUtils from '@shared/utils/string';
import { IFileAttachment } from '@shared/values/file-attachments/types/file-attachment.types';

import fileAttachmentError from './file-attachment.error';

/**
 * Validates a URL string.
 */
function validateUrl(url: string) {
  if (!stringUtils.isUrl(url)) {
    throw new fileAttachmentError.InvalidUrl({ url });
  }
}

/**
 * Validates an attachment name.
 */
function validateName(name: string) {
  if (!stringUtils.isNonEmptyString(name)) {
    throw new fileAttachmentError.InvalidName({ name });
  }
}

/**
 * Validates an attachment MIME type.
 */
function validateType(type: string) {
  if (!stringUtils.isNonEmptyString(type)) {
    throw new fileAttachmentError.InvalidType({ type });
  }
}

/**
 * Validates an attachment file size.
 */
function validateSize(size: number) {
  if (typeof size !== 'number' || size <= 0) {
    throw new fileAttachmentError.InvalidSize({ size });
  }
}

/**
 * Creates a validated, frozen file attachment.
 */
function make(payload: {
  url: string;
  name: string;
  type: string;
  size: number;
}): IFileAttachment {
  validateUrl(payload.url);
  validateName(payload.name);
  validateType(payload.type);
  validateSize(payload.size);

  return Object.freeze({
    url: payload.url,
    name: payload.name,
    type: payload.type.trim(),
    size: payload.size,
  });
}

/**
 * Validates an existing file attachment object.
 */
function validate(attachment: IFileAttachment) {
  validateUrl(attachment.url);
  validateName(attachment.name);
  validateType(attachment.type);
  validateSize(attachment.size);
}

/**
 * Validates an array of file attachments.
 */
function validateMany(attachments: IFileAttachment[]) {
  if (!Array.isArray(attachments)) {
    throw new fileAttachmentError.InvalidAttachments({ attachments });
  }
  for (const attachment of attachments) {
    validate(attachment);
  }
}

const fileAttachmentValue = Object.freeze({
  make,
  validate,
  validateMany,
});

export default fileAttachmentValue;
