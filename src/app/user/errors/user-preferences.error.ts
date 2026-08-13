import { TErrorCause } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import appError from '@shared/values/errors/app.error';

type TErrorKeyPrefix = `app_error_user_preferences_${string}`;

const EErrorKeys = {
  Inconsistent: 'app_error_user_preferences_inconsistent_internal_server_error',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UUserPreferencesAppError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class UserPreferencesAppError extends appError.Base<UUserPreferencesAppError> {
  constructor(key: UUserPreferencesAppError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'UserPreferencesAppError';
  }
}

const userPreferencesAppError = Object.freeze({
  Base: UserPreferencesAppError,
  ...errorUtils.getMappedErrors(EErrorKeys, UserPreferencesAppError),
});

export default userPreferencesAppError;
