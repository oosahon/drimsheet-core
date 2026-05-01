import { DomainError, TErrorCause } from '../utils/error';

type TValueErrorPrefix = `value_error_${string}`;

export class ValueError<K extends TValueErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
  }
}

export default ValueError;
