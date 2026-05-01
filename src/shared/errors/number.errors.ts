import { TErrorCause } from '../types/error.types';
import errorUtils from '../utils/error';
import { ValueError } from './value.errors';

type TErrorKeyPrefix = `value_error_number_${string}`;

const EErrorKeys = {
  InvalidValue: 'value_error_number_invalid_value',
  InvalidFloat: 'value_error_number_invalid_float',
  NegativeValue: 'value_error_number_negative_value',
  NonPositiveValue: 'value_error_number_non_positive_value',
} as const satisfies Record<string, TErrorKeyPrefix>;

type USpecificNumberError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class SpecificNumberError extends ValueError<USpecificNumberError> {
  constructor(key: USpecificNumberError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const numberError = Object.freeze({
  Error: SpecificNumberError,
  ...errorUtils.getMappedErrors(EErrorKeys, SpecificNumberError),
});

export default numberError;
