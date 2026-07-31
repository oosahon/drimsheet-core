export const EPaginationSortDirection = {
  Asc: 'asc',
  Desc: 'desc',
} as const;

export type UPaginationSortDirection =
  (typeof EPaginationSortDirection)[keyof typeof EPaginationSortDirection];

export interface IPaginationParams {
  limit?: number;
  offset?: number;
  orderBy?: string;
  sortDirection?: UPaginationSortDirection;
  search?: string;
}

export interface IPaginationResponseMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IPaginatedResponse<T> {
  data: T[];
  meta: IPaginationResponseMeta;
}
