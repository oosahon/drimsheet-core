import { TErrorCause, TErrorKey, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import DomainError from '@shared/values/errors/domain.error';

type TErrorKeyPrefix = TErrorKey<'pagination_error'>;

const EErrorKeys = {
  InvalidOrderBy: 'pagination_error_sort_by_invalid',
  InvalidSortDirection: 'pagination_error_sort_order_invalid',
  InvalidLimit: 'pagination_error_limit_invalid',
  InvalidOffset: 'pagination_error_offset_invalid',
  InvalidSearch: 'pagination_error_search_invalid',
} as const satisfies TErrorKeys<'pagination_error'>;

type UPaginationError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class PaginationError<
  K extends TErrorKeyPrefix = UPaginationError,
> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'PaginationError';
  }
}

const paginationError = Object.freeze({
  Base: PaginationError,
  ...errorUtils.getMappedErrors(EErrorKeys, PaginationError),
});

export default paginationError;
