import { TErrorCause } from '../types/error.types';
import DomainError from './domain.error';

export default class AppError<K extends string> extends DomainError<K> {
  constructor(errorKey: K, cause?: TErrorCause) {
    super(errorKey, cause);
  }
}
