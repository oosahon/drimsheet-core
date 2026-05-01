import { TErrorCause } from '../types/error.types';
import errorUtils from '../utils/error';
import { ValueError } from './value.error';

type TErrorKeyPrefix = `value_error_string_${string}`;

const EErrorKeys = {
  InvalidString: 'value_error_string_invalid_string',
  InvalidUUID: 'value_error_string_invalid_uuid',
} as const satisfies Record<string, TErrorKeyPrefix>;

class StringError extends ValueError<TErrorKeyPrefix> {
  constructor(key: TErrorKeyPrefix, cause?: TErrorCause) {
    super(key, cause);
  }
}

const stringError = Object.freeze({
  Base: StringError,
  ...errorUtils.getMappedErrors(EErrorKeys, StringError),
});

export default stringError;
