import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';
import { AccountingError } from './accounting.error';

type TErrorKeyPrefix = `accounting_error_accounting_entity_${string}`;

const EErrorKeys = {
  Unauthorized: 'accounting_error_accounting_entity_unauthorized',
  InvalidType: 'accounting_error_accounting_entity_invalid_type',
  InvalidJurisdictionCode:
    'accounting_error_accounting_entity_invalid_jurisdiction_code',
  InvalidAuditTrailAction:
    'accounting_error_accounting_entity_invalid_audit_trail_action',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UAccountingEntityError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class AccountingEntityError extends AccountingError<UAccountingEntityError> {
  constructor(key: UAccountingEntityError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const accountingEntityError = Object.freeze({
  Error: AccountingEntityError,
  ...errorUtils.getMappedErrors(EErrorKeys, AccountingEntityError),
});

export default accountingEntityError;
