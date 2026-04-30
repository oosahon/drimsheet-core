import { CategoryError } from '.';
import { getMappedErrors, TErrorCause } from '../../../shared/utils/error';

type TErrorKeyPrefix = `category_error_category_${string}`;

const EErrorKeys = {
  InvalidStatus: 'category_error_category_invalid_status',
  InvalidHistoryAction: 'category_error_category_invalid_history_action',
} as const satisfies Record<string, TErrorKeyPrefix>;

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
