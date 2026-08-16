import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';

import userError from './user.error';

const EErrorKeys = {
  InvalidType: 'user_error_user_value_object_type_invalid',
  InvalidFormat: 'user_error_user_value_object_format_invalid',
  TooShort: 'user_error_user_value_object_too_short_invalid',
  TooLong: 'user_error_user_value_object_too_long_invalid',
} as const satisfies TErrorKeys<'user_error_user_value_object'>;

type UUserValueObjectError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class UserValueObjectError extends userError.Base<UUserValueObjectError> {
  constructor(key: UUserValueObjectError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'UserValueObjectError';
  }
}

const userValueObjectError = Object.freeze({
  Base: UserValueObjectError,
  ...errorUtils.getMappedErrors(EErrorKeys, UserValueObjectError),
});

export default userValueObjectError;
