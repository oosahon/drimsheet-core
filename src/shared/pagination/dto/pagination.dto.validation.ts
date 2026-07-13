import z from 'zod';
import paginationError from '../pagination.error';
import {
  EPaginationSortDirection,
  UPaginationSortDirection,
} from '../types/pagination.types';

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
const invalidPageKey = new InvalidOffset().errorKey;
const invalidSearchKey = new InvalidSearch().errorKey;

export const paginationSortDirectionValidationSchema = z.enum(
  Object.values(EPaginationSortDirection) as [
    UPaginationSortDirection,
    ...UPaginationSortDirection[],
  ],
  InvalidSortDirectionKey
);

export const paginationQueryValidationSchema = z.object({
  limit: z
    .number(invalidLimitKey)
    .min(1, invalidLimitKey)
    .max(200, invalidLimitKey)
    .optional(),
  page: z.number(invalidPageKey).min(1, invalidPageKey).optional(),
  orderBy: z.string(InvalidOrderByKey).optional(),
  sortDirection: paginationSortDirectionValidationSchema.optional(),
  search: z.string(invalidSearchKey).optional(),
});
