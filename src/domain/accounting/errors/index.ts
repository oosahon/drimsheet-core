import { DomainError, TErrorCause } from '../../../shared/errors/error';

type TAccountingErrorKeyPrefix = `accounting_error_${string}`;

export class AccountingError<
  K extends TAccountingErrorKeyPrefix,
> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, key, cause);
  }
}

export default AccountingError;
