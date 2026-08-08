import { TErrorCause } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';

import accountingError from './accounting.error';

type TErrorKeyPrefix = `accounting_error_accounting_entity_${string}`;

const EErrorKeys = {
  Unauthorized: 'accounting_error_accounting_entity_unauthorized',
  InvalidType: 'accounting_error_accounting_entity_invalid_type',
  InvalidJurisdictionCode:
    'accounting_error_accounting_entity_invalid_jurisdiction_code',
  InvalidHistoryAction:
    'accounting_error_accounting_entity_invalid_history_action',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UAccountingEntityError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class AccountingEntityError extends accountingError.Base<UAccountingEntityError> {
  constructor(key: UAccountingEntityError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'AccountingEntityError';
  }
}

const accountingEntityError = Object.freeze({
  Base: AccountingEntityError,
  ...errorUtils.getMappedErrors(EErrorKeys, AccountingEntityError),
});

export default accountingEntityError;
