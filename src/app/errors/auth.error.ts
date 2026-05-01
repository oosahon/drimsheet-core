import AppError from '../../shared/errors/app.error';
import { TErrorCause } from '../../shared/types/error.types';
import errorUtils from '../../shared/utils/error';

type TErrorKeyPrefix = `app_error_auth_${string}`;

const EErrorKeys = {
  ExpiredToken: 'app_error_auth_expired_token',
  InvalidToken: 'app_error_auth_invalid_token',
  MalformedToken: 'app_error_auth_malformed_token',
  MissingToken: 'app_error_auth_missing_token',
  InvalidCredentials: 'app_error_auth_invalid_credentials',
  AccountLocked: 'app_error_auth_account_locked',
  WrongStrategy: 'app_error_auth_wrong_strategy',
  EmailRequired: 'app_error_auth_email_required',
  UserNotFound: 'app_error_auth_user_not_found',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UErrorKeys = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class AuthError extends AppError<UErrorKeys> {
  constructor(key: UErrorKeys, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'AuthError';
  }
}

const authError = Object.freeze({
  Base: AuthError,
  ...errorUtils.getMappedErrors(EErrorKeys, AuthError),
});

export default authError;
