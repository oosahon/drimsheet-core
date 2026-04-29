import { AccountingError } from '.';
import { TErrorCause } from '../../../shared/errors/error';

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

class UnauthorizedUserAccessError extends AccountingEntityError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.Unauthorized, cause);
  }
}

const accountingEntityError = Object.freeze({
  Error: AccountingEntityError,
  UnauthorizedUserAccess: UnauthorizedUserAccessError,
});

export default accountingEntityError;
