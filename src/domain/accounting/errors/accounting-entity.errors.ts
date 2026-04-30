import { AccountingError } from '.';
import { getMappedErrors, TErrorCause } from '../../../shared/utils/error';

type TErrorKeyPrefix = `accounting_error_accounting_entity_${string}`;

const EErrorKeys = {
  Unauthorized: 'accounting_error_accounting_entity_unauthorized',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UAccountingEntityError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class AccountingEntityError extends AccountingError<UAccountingEntityError> {
  constructor(key: UAccountingEntityError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const accountingEntityError = Object.freeze({
  Error: AccountingEntityError,
  ...getMappedErrors(EErrorKeys, AccountingEntityError),
});

export default accountingEntityError;
