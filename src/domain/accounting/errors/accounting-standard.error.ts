import { AccountingError } from '.';
import { getMappedErrors, TErrorCause } from '../../../shared/errors/error';

type TErrorKeyPrefix = `accounting_error_standard_${string}`;

const EErrorKeys = {
  Invalid: 'accounting_error_standard_invalid',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UAccountingStandardError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class AccountingStandardError extends AccountingError<UAccountingStandardError> {
  constructor(key: UAccountingStandardError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const accountingStandardError = Object.freeze({
  Error: AccountingStandardError,
  ...getMappedErrors(EErrorKeys, AccountingStandardError),
});

export default accountingStandardError;
