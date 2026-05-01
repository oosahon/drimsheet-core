import DomainError from '../../../shared/errors/domain.error';
import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';

type TErrorPrefix = `user_error_${string}`;

const EErrorKeys = {
  InvalidValue: 'user_error_invalid_value',
} as const satisfies Record<string, TErrorPrefix>;

type UUserError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class UserError<K extends TErrorPrefix = UUserError> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'UserError';
  }
}

const userError = Object.freeze({
  Base: UserError,
  ...errorUtils.getMappedErrors(EErrorKeys, UserError),
});

export default userError;
