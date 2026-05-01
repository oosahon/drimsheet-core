import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';
import { UserError } from './user.error';

type TErrorKeyPrefix = `user_error_user_value_object_${string}`;

const EErrorKeys = {
  InvalidType: 'user_error_user_value_object_invalid_type',
  InvalidFormat: 'user_error_user_value_object_invalid_format',
  TooShort: 'user_error_user_value_object_too_short',
  TooLong: 'user_error_user_value_object_too_long',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UUserValueObjectError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class UserValueObjectError extends UserError<UUserValueObjectError> {
  constructor(key: UUserValueObjectError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const userValueObjectError = Object.freeze({
  Error: UserValueObjectError,
  ...errorUtils.getMappedErrors(EErrorKeys, UserValueObjectError),
});

export default userValueObjectError;
