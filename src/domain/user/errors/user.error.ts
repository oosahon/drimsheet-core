import DomainError from '../../../shared/errors/domain.error';
import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';

type TErrorPrefix = `user_error_${string}`;

class UserError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
  }
}

const EErrorKeys = {} as const satisfies Record<string, TErrorPrefix>;

const userError = Object.freeze({
  Base: UserError,
  ...errorUtils.getMappedErrors(EErrorKeys, UserError),
});

export default userError;
