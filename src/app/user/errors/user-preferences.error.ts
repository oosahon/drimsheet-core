import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import appError from '@shared/values/errors/app.error';

const EErrorKeys = {
  InvalidAppUsageMode: 'app_error_user_preferences_app_usage_mode_invalid',
} as const satisfies TErrorKeys<'app_error_user_preferences'>;

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
