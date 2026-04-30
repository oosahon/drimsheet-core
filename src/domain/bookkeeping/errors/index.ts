import { DomainError, TErrorCause } from '../../../shared/errors/error';

type TErrorPrefix = `bookkeeping_error_${string}`;

export class BookkeepingError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, key, cause);
  }
}

export default BookkeepingError;
