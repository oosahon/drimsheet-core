import { DomainError, TErrorCause } from '../../../shared/errors/error';

type TErrorPrefix = `accounting_error_${string}`;

export class AccountingError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, key, cause);
  }
}

export default AccountingError;
