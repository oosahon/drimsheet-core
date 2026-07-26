import { TErrorCause } from '../types/error.types';
import errorUtils from '../utils/error';
import DomainError from './domain.error';

type TErrorPrefix = `date_error_${string}`;

const EErrorKeys = {
  InvalidDate: 'date_error_invalid_date',
  InvalidDates: 'date_error_invalid_dates',
} as const satisfies Record<string, TErrorPrefix>;

type UDateError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class DateError extends DomainError<UDateError> {
  constructor(key: UDateError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'DateError';
  }
}

const dateError = Object.freeze({
  Base: DateError,
  ...errorUtils.getMappedErrors(EErrorKeys, DateError),
});

export default dateError;
