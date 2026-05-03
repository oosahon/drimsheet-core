import {
  EPaginationSortDirection,
  IPaginatedResponse,
  IPaginationParams,
  IPaginationResponseMeta,
  UPaginationSortDirection,
} from '../types/pagination.types';

function getLimit(limit?: number): number {
  if (limit && limit > 200) return 200;
  return limit ?? 20;
}

function getOffset(offset?: number): number {
  if (offset && offset > 2000) return 2000;
  return offset ?? 0;
}

function getPage(limit: number, offset: number): number {
  return offset / limit + 1;
}

function getResponseMeta(
  total: number,
  params: IPaginationParams
): IPaginationResponseMeta {
  const limit = getLimit(params.limit);
  const offset = getOffset(params.offset);
  const page = getPage(limit, offset);
  const totalPages = Math.ceil(total / limit);

  return Object.freeze({
    page,
    limit,
    total,
    totalPages,
  });
}

function getPaginatedResponse<T>(
  data: T[],
  total: number,
  params: IPaginationParams
): IPaginatedResponse<T> {
  const meta = getResponseMeta(total, params);
  return Object.freeze({
    data,
    meta,
  });
}

function getSortDirection(
  direction?: UPaginationSortDirection
): UPaginationSortDirection {
  return direction ?? EPaginationSortDirection.Desc;
}

const paginationValue = Object.freeze({
  getLimit,
  getOffset,
  getPage,
  getResponseMeta,
  getPaginatedResponse,
  getSortDirection,
});

export default paginationValue;
