import { DomainError, TErrorCause } from '../../../shared/errors/error';

type TErrorPrefix = `ledger_error_${string}`;

export class LedgerError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, key, cause);
  }
}

export default LedgerError;
