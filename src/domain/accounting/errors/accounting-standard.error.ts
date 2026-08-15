import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';

import accountingError from './accounting.error';

const EErrorKeys = {
  Invalid: 'accounting_error_standard_invalid',
} as const satisfies TErrorKeys<'accounting_error_standard'>;

type UAccountingStandardError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class AccountingStandardError extends accountingError.Base<UAccountingStandardError> {
  constructor(key: UAccountingStandardError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'AccountingStandardError';
  }
}

const accountingStandardError = Object.freeze({
  Base: AccountingStandardError,
  ...errorUtils.getMappedErrors(EErrorKeys, AccountingStandardError),
});

export default accountingStandardError;
