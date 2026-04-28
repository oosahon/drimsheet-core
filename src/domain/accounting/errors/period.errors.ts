import { AccountingError } from '.';
import { TErrorCause } from '../../../shared/errors/error';

type TErrorKeyPrefix = `accounting_error_period_${string}`;

const EErrorKeys = {
  InvalidUnit: 'accounting_error_period_invalid_unit',
  InvalidStatus: 'accounting_error_period_invalid_status',
  InvalidDateRange: 'accounting_error_period_invalid_date_range',
  EndDateIsInThePast: 'accounting_error_period_end_date_is_in_the_past',
  InvalidInterval: 'accounting_error_period_invalid_interval',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UPeriodError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class PeriodError extends AccountingError<UPeriodError> {
  constructor(key: UPeriodError, cause?: TErrorCause) {
    super(key, cause);
  }
}

class InvalidPeriodUnitError extends PeriodError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.InvalidUnit, cause);
  }
}

class InvalidPeriodStatusError extends PeriodError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.InvalidStatus, cause);
  }
}

class InvalidPeriodDateRangeError extends PeriodError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.InvalidDateRange, cause);
  }
}

class EndDateIsInThePastError extends PeriodError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.EndDateIsInThePast, cause);
  }
}

class InvalidPeriodIntervalError extends PeriodError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.InvalidInterval, cause);
  }
}

const periodError = Object.freeze({
  Error: PeriodError,
  InvalidUnit: InvalidPeriodUnitError,
  InvalidStatus: InvalidPeriodStatusError,
  InvalidDateRange: InvalidPeriodDateRangeError,
  EndDateIsInThePast: EndDateIsInThePastError,
  InvalidInterval: InvalidPeriodIntervalError,
});

export default periodError;
