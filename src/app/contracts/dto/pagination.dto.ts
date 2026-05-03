import z from 'zod';
import paginationError from '../../../shared/errors/pagination.error';
import {
  EPaginationSortDirection,
  IPaginationParams,
  UPaginationSortDirection,
} from '../../../shared/types/pagination.types';

const {
  InvalidSortDirection,
  InvalidOrderBy,
  InvalidLimit,
  InvalidOffset,
  InvalidSearch,
} = paginationError;

const InvalidSortDirectionKey = new InvalidSortDirection().errorKey;
const InvalidOrderByKey = new InvalidOrderBy().errorKey;
const invalidLimitKey = new InvalidLimit().errorKey;
const invalidOffsetKey = new InvalidOffset().errorKey;
const invalidSearchKey = new InvalidSearch().errorKey;

export const paginationsortDirectionValidationSchema = z.enum(
  Object.values(EPaginationSortDirection) as [
    UPaginationSortDirection,
    ...UPaginationSortDirection[],
  ],
  InvalidSortDirectionKey
);

export interface IPaginationDto extends IPaginationParams {}

export const paginationQueryValidationSchema = z.object({
  limit: z.number(invalidLimitKey).max(200, invalidLimitKey).optional(),
  offset: z.number(invalidOffsetKey).max(2000, invalidOffsetKey).optional(),
  orderBy: z.string(InvalidOrderByKey).optional(),
  sortDirection: paginationsortDirectionValidationSchema.optional(),
  search: z.string(invalidSearchKey).optional(),
});
