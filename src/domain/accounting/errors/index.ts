import { DomainError } from '../../../shared/value-objects/error';
import { EAccountingError, UAccountingError } from './types';

class AccountingError extends DomainError<UAccountingError> {
  constructor(key: UAccountingError, cause?: Record<string, unknown>) {
    super(key, key, cause);
  }
}

class DuplicateAccountingEntity extends AccountingError {
  constructor(cause?: Record<string, unknown>) {
    super(EAccountingError.DuplicateAccountingEntity, cause);
  }
}

class UnauthorizedUserAccess extends AccountingError {
  constructor(cause?: Record<string, unknown>) {
    super(EAccountingError.UnauthorizedUserAccess, cause);
  }
}

const accountingError = Object.freeze({
  Error: AccountingError,
  DuplicateAccountingEntity,
  UnauthorizedUserAccess,
});

export default accountingError;
