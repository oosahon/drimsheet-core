import { TErrorCause } from '../types/error.types';
import errorUtils from '../utils/error';
import { ValueError } from './value.errors';

type TErrorKeyPrefix = `value_error_string_${string}`;

const EErrorKeys = {
  InvalidString: 'value_error_string_invalid_string',
  InvalidUUID: 'value_error_string_invalid_uuid',
} as const satisfies Record<string, TErrorKeyPrefix>;

type USpecificStringError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class SpecificStringError extends ValueError<USpecificStringError> {
  constructor(key: USpecificStringError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const stringError = Object.freeze({
  Error: SpecificStringError,
  ...errorUtils.getMappedErrors(EErrorKeys, SpecificStringError),
});

export default stringError;
