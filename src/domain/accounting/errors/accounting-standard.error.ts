import { AccountingError } from '.';
import { TErrorCause } from '../../../shared/errors/error';

type TErrorKeyPrefix = `accounting_error_standard_${string}`;

const EErrorKeys = {
  Invalid: 'accounting_error_standard_invalid',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UErrorKey = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class AccountingStandardError extends AccountingError<UErrorKey> {
  constructor(key: UErrorKey, cause?: TErrorCause) {
    super(key, cause);
  }
}

class InvalidAccountingStandardError extends AccountingStandardError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.Invalid, cause);
  }
}

const accountingStandardError = Object.freeze({
  Error: AccountingStandardError,
  InvalidStandard: InvalidAccountingStandardError,
});

export default accountingStandardError;
