import { UserError } from '.';
import { getMappedErrors, TErrorCause } from '../../../shared/errors/error';

type TErrorKeyPrefix = `user_error_user_activity_${string}`;

const EErrorKeys = {
  InvalidMeta: 'user_error_user_activity_invalid_meta',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UUserActivityError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class UserActivityError extends UserError<UUserActivityError> {
  constructor(key: UUserActivityError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const userActivityError = Object.freeze({
  Error: UserActivityError,
  ...getMappedErrors(EErrorKeys, UserActivityError),
});

export default userActivityError;
