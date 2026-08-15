import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';

import DomainError from './domain.error';

const EErrorKeys = {
  InvalidDate: 'date_error_date_invalid',
  InvalidDates: 'date_error_dates_invalid',
} as const satisfies TErrorKeys<'date_error'>;

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
