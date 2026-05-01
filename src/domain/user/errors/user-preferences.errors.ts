import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';
import { UserError } from './user.error';

type TErrorKeyPrefix = `user_error_user_preferences_${string}`;

const EErrorKeys = {
  InvalidAppPreferences: 'user_error_user_preferences_invalid_app_preferences',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UUserPreferencesError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class UserPreferencesError extends UserError<UUserPreferencesError> {
  constructor(key: UUserPreferencesError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const userPreferencesError = Object.freeze({
  Error: UserPreferencesError,
  ...errorUtils.getMappedErrors(EErrorKeys, UserPreferencesError),
});

export default userPreferencesError;
