import { DomainError, TErrorCause } from '../../../shared/utils/error';

type TErrorPrefix = `category_error_${string}`;

export class CategoryError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, key, cause);
  }
}

export default CategoryError;
