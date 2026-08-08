import { TErrorCause } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import DomainError from '@shared/values/errors/domain.error';

type TErrorKeyPrefix = `file_attachment_error_${string}`;

const EErrorKeys = {
  InvalidUrl: 'file_attachment_error_invalid_url',
  InvalidName: 'file_attachment_error_invalid_name',
  InvalidType: 'file_attachment_error_invalid_type',
  InvalidSize: 'file_attachment_error_invalid_size',
  InvalidAttachments: 'file_attachment_error_invalid_attachments',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UFileAttachmentError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class FileAttachmentError extends DomainError<UFileAttachmentError> {
  constructor(key: UFileAttachmentError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'FileAttachmentError';
  }
}

const fileAttachmentError = Object.freeze({
  Base: FileAttachmentError,
  ...errorUtils.getMappedErrors(EErrorKeys, FileAttachmentError),
});

export default fileAttachmentError;
