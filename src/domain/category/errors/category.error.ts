import DomainError from '../../../shared/errors/domain.error';
import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';

type TErrorPrefix = `category_error_${string}`;

class CategoryError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'CategoryError';
  }
}

const EErrorKeys = {
  InvalidValue: 'category_error_invalid_value',
  InvalidStatus: 'category_error_invalid_status',
  InvalidHistoryAction: 'category_error_invalid_history_action',
} as const satisfies Record<string, TErrorPrefix>;

const categoryError = Object.freeze({
  Base: CategoryError,
  ...errorUtils.getMappedErrors(EErrorKeys, CategoryError),
});

export default categoryError;
