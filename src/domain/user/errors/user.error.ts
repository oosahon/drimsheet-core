import DomainError from '../../../shared/errors/domain.error';
import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';

type TErrorPrefix = `user_error_${string}`;

export class UserError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
  }
}

const EErrorKeys = {} as const satisfies Record<string, TErrorPrefix>;

type USpecificUserError = never;

class SpecificUserError extends UserError<USpecificUserError> {
  constructor(key: USpecificUserError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const userError = Object.freeze({
  Error: SpecificUserError,
  ...errorUtils.getMappedErrors(EErrorKeys, SpecificUserError),
});

export default userError;
