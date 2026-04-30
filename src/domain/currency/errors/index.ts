import { DomainError, TErrorCause } from '../../../shared/errors/error';

type TErrorPrefix = `currency_error_${string}`;

export class CurrencyError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, key, cause);
  }
}

export default CurrencyError;
