import { TErrorCause, TErrorKeys } from '../types/error.types';
import errorUtils from '../utils/error';
import { ValueError } from './value.errors';

type TErrorKeyPrefix = `value_error_number_${string}`;

const EErrorKeys: TErrorKeys<TErrorKeyPrefix> = {
  InvalidValue: 'value_error_number_invalid_value',
  InvalidFloat: 'value_error_number_invalid_float',
  NegativeValue: 'value_error_number_negative_value',
  NonPositiveValue: 'value_error_number_non_positive_value',
};

class NumberError extends ValueError<TErrorKeyPrefix> {
  constructor(key: TErrorKeyPrefix, cause?: TErrorCause) {
    super(key, cause);
  }
}

const numberError = Object.freeze({
  Base: NumberError,
  ...errorUtils.getMappedErrors(EErrorKeys, NumberError),
});

export default numberError;
