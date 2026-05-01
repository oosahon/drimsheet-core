import { TErrorCause } from '../types/error.types';
import errorUtils from '../utils/error';
import { ValueError } from './value.errors';

type TErrorKeyPrefix = `value_error_date_${string}`;

const EErrorKeys = {
  Invalid: 'value_error_date_invalid',
  Past: 'value_error_date_past',
  Future: 'value_error_date_future',
  PastOrPresent: 'value_error_date_past_or_present',
  EarlierOrEqual: 'value_error_date_earlier_or_equal',
  LaterOrEqual: 'value_error_date_later_or_equal',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UDateError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class DateError extends ValueError<UDateError> {
  constructor(key: UDateError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const dateError = Object.freeze({
  Error: DateError,
  ...errorUtils.getMappedErrors(EErrorKeys, DateError),
});

export default dateError;
