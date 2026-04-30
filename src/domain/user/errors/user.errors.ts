import { UserError } from '.';
import { getMappedErrors, TErrorCause } from '../../../shared/utils/error';

type TErrorKeyPrefix = `user_error_user_${string}`;

const EErrorKeys = {} as const satisfies Record<string, TErrorKeyPrefix>;

type USpecificUserError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class SpecificUserError extends UserError<USpecificUserError> {
  constructor(key: USpecificUserError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const userError = Object.freeze({
  Error: SpecificUserError,
  ...getMappedErrors(EErrorKeys, SpecificUserError),
});

export default userError;
