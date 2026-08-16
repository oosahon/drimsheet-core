import { TErrorCause, TErrorKey } from '@shared/types/error.types';

export default class DomainError<K extends TErrorKey> extends Error {
  errorKey: K;
  cause?: TErrorCause;

  constructor(errorKey: K, cause?: TErrorCause) {
    super(errorKey);
    this.name = this.constructor.name;
    this.errorKey = errorKey;
    this.cause = cause;
  }
}
