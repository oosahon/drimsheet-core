import {
  DomainError,
  getMappedErrors,
  TErrorCause,
} from '../../../shared/utils/error';

type TErrorPrefix = `category_error_${string}`;

export class CategoryError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
  }
}

const EErrorKeys = {
  InvalidStatus: 'category_error_invalid_status',
  InvalidHistoryAction: 'category_error_invalid_history_action',
} as const satisfies Record<string, TErrorPrefix>;

type USpecificCategoryError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class SpecificCategoryError extends CategoryError<USpecificCategoryError> {
  constructor(key: USpecificCategoryError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const categoryError = Object.freeze({
  Error: SpecificCategoryError,
  ...getMappedErrors(EErrorKeys, SpecificCategoryError),
});

export default categoryError;
