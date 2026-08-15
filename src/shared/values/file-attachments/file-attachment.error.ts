import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import DomainError from '@shared/values/errors/domain.error';

const EErrorKeys = {
  InvalidUrl: 'file_attachment_error_url_invalid',
  InvalidName: 'file_attachment_error_name_invalid',
  InvalidType: 'file_attachment_error_type_invalid',
  InvalidSize: 'file_attachment_error_size_invalid',
  InvalidAttachments: 'file_attachment_error_attachments_invalid',
} as const satisfies TErrorKeys<'file_attachment_error'>;

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
