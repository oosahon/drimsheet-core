import DomainError from '../../../shared/errors/domain.error';
import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';

type TErrorKeyPrefix = `auth_error_${string}`;

const EErrorKeys = {
  InvalidValue: 'auth_error_invalid_value',
  ExpiredToken: 'auth_error_expired_token',
  InvalidToken: 'auth_error_invalid_token',
  MalformedToken: 'auth_error_malformed_token',
  MissingToken: 'auth_error_missing_token',
  InvalidCredentials: 'auth_error_invalid_credentials',
  AccountLocked: 'auth_error_account_locked',
  WrongStrategy: 'auth_error_wrong_strategy',
  EmailRequired: 'auth_error_email_required',
  UserNotFound: 'auth_error_user_not_found',
  InvalidFirstName: 'auth_error_invalid_first_name',
  InvalidLastName: 'auth_error_invalid_last_name',
  InvalidEmail: 'auth_error_invalid_email',
  InvalidPassword: 'auth_error_invalid_password',
  InvalidConfirmPassword: 'auth_error_invalid_confirm_password',
  PasswordsDoNotMatch: 'auth_error_passwords_do_not_match',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UErrorKeys = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class AuthError extends DomainError<UErrorKeys> {
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
