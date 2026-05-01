import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';
import userError from './user.error';

type TErrorKeyPrefix = `user_error_user_preferences_${string}`;

const EErrorKeys = {
  InvalidAppPreferences: 'user_error_user_preferences_invalid_app_preferences',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UUserPreferencesError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class UserPreferencesError extends userError.Base<UUserPreferencesError> {
  constructor(key: UUserPreferencesError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'UserPreferencesError';
  }
}

const userPreferencesError = Object.freeze({
  Base: UserPreferencesError,
  ...errorUtils.getMappedErrors(EErrorKeys, UserPreferencesError),
});

export default userPreferencesError;
