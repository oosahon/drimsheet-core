import { TErrorCause } from '../../types/error.types';
import errorUtils from '../../utils/error';
import DomainError from '../errors/domain.error';

type TErrorKeyPrefix = `pagination_error_${string}`;

const EErrorKeys = {
  InvalidOrderBy: 'pagination_error_invalid_sort_by',
  InvalidSortDirection: 'pagination_error_invalid_sort_order',
  InvalidLimit: 'pagination_error_invalid_limit',
  InvalidOffset: 'pagination_error_invalid_offset',
  InvalidSearch: 'pagination_error_invalid_search',
} as const satisfies Record<string, TErrorKeyPrefix>;

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
