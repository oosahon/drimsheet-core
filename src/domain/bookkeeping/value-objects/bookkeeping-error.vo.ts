import { DomainError } from '../../../shared/value-objects/error';
import { EBookkeepingError, UBookkeepingError } from '../types/error.types';

class BookkeepingError extends DomainError<UBookkeepingError> {
  constructor(key: UBookkeepingError, cause?: Record<string, unknown>) {
    super(key, key, cause);
  }
}

class AccountingEntityNotFound extends BookkeepingError {
  constructor(cause?: Record<string, unknown>) {
    super(EBookkeepingError.AccountingEntityNotFound, cause);
  }
}

const bookkeepingError = Object.freeze({
  Error: BookkeepingError,
  AccountingEntityNotFound,
});

export default bookkeepingError;
