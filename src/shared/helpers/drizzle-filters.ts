import { asc, desc } from 'drizzle-orm';
import {
  EPaginationSortDirection,
  UPaginationSortDirection,
} from '../values/pagination/types/pagination.types';

function getSortDirection(direction?: UPaginationSortDirection) {
  return direction === EPaginationSortDirection.Asc ? asc : desc;
}

const drizzleFilters = Object.freeze({
  getSortDirection,
});

export default drizzleFilters;
