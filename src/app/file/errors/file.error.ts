import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import appError from '@shared/values/errors/app.error';

const EErrorKeys = {
  UploadUnexpected: 'app_error_file_upload_unexpected',
} as const satisfies TErrorKeys<'app_error_file'>;

type UFileError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class FileAppError extends appError.Base<UFileError> {
  constructor(key: UFileError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'FileAppError';
  }
}

const fileAppError = Object.freeze({
  Base: FileAppError,
  ...errorUtils.getMappedErrors(EErrorKeys, FileAppError),
});

export default fileAppError;
