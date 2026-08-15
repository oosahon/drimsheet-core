import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import DomainError from '@shared/values/errors/domain.error';

const EErrorKeys = {
  InvalidValue: 'auth_error_value_invalid',
  ExpiredToken: 'auth_error_token_expired_unauthorized',
  InvalidToken: 'auth_error_token_invalid_unauthorized',
  MalformedToken: 'auth_error_token_malformed_unauthorized',
  MissingToken: 'auth_error_token_missing_unauthorized',
  InvalidCredentials: 'auth_error_credentials_invalid_unauthorized',
  EmailRequired: 'auth_error_email_required_invalid',
  UserNotFound: 'auth_error_user_not_found',
  InvalidFirstName: 'auth_error_first_name_invalid',
  InvalidLastName: 'auth_error_last_name_invalid',
  InvalidEmail: 'auth_error_email_invalid',
  InvalidPassword: 'auth_error_password_invalid',
  InvalidConfirmPassword: 'auth_error_confirm_password_invalid',
  PasswordsDoNotMatch: 'auth_error_passwords_do_not_match_invalid',
  TooManyRequests: 'auth_error_too_many_requests',
  InconsistentUserAuth: 'auth_error_inconsistent_user_auth_unexpected',
} as const satisfies TErrorKeys<'auth_error'>;

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
