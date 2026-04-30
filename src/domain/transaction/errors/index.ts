import { DomainError, TErrorCause } from '../../../shared/utils/error';

type TErrorPrefix = `transaction_error_${string}`;

export class TransactionError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, key, cause);
  }
}

export default TransactionError;
