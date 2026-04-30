import { AccountingError } from '.';
import { getMappedErrors, TErrorCause } from '../../../shared/errors/error';

type TErrorKeyPrefix = `accounting_error_period_${string}`;

const EErrorKeys = {
  InvalidUnit: 'accounting_error_period_invalid_unit',
  InvalidStatus: 'accounting_error_period_invalid_status',
  InvalidDateRange: 'accounting_error_period_invalid_date_range',
  PastEndDate: 'accounting_error_period_past_end_date',
  InvalidInterval: 'accounting_error_period_invalid_interval',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UPeriodError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class PeriodError extends AccountingError<UPeriodError> {
  constructor(key: UPeriodError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const periodError = Object.freeze({
  Error: PeriodError,
  ...getMappedErrors(EErrorKeys, PeriodError),
});

export default periodError;
