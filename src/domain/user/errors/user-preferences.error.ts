import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';

import userError from './user.error';

const EErrorKeys = {
  InvalidAppPreferences: 'user_error_user_preferences_app_preferences_invalid',
  InvalidAppUsageMode: 'user_error_user_preferences_app_usage_mode_invalid',
} as const satisfies TErrorKeys<'user_error_user_preferences'>;

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
