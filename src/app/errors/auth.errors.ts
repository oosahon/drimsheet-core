import {
  DomainError,
  getMappedErrors,
  TErrorCause,
} from '../../shared/utils/error';

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
} as const satisfies Record<string, TErrorKeyPrefix>;

type USpecificAuthError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class SpecificAuthError extends DomainError<USpecificAuthError> {
  constructor(key: USpecificAuthError, cause?: TErrorCause) {
    super(key, 'Authentication failed', cause);
    this.name = 'AuthError';
  }
}

const authError = Object.freeze({
  Error: SpecificAuthError,
  ...getMappedErrors(EErrorKeys, SpecificAuthError),
});

export default authError;
