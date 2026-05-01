import { TErrorCause } from '../types/error.types';
import DomainError from './domain.error';

type TErrorPrefix = `app_error_${string}`;

export default class AppError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(errorKey: K, cause?: TErrorCause) {
    super(errorKey, cause);
  }
}
