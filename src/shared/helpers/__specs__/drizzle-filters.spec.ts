import { asc, desc } from 'drizzle-orm';
import { EPaginationSortDirection } from '../../pagination/types/pagination.types';
import drizzleFilters from '../drizzle-filters';

describe('drizzleFilters', () => {
  describe('getSortDirection', () => {
    it('returns asc function when direction is EPaginationSortDirection.Asc', () => {
      const result = drizzleFilters.getSortDirection(
        EPaginationSortDirection.Asc
      );
      expect(result).toBe(asc);
    });

    it('returns desc function when direction is EPaginationSortDirection.Desc', () => {
      const result = drizzleFilters.getSortDirection(
        EPaginationSortDirection.Desc
      );
      expect(result).toBe(desc);
    });

    it('defaults to desc function when direction is undefined', () => {
      const result = drizzleFilters.getSortDirection();
      expect(result).toBe(desc);
    });

    it('defaults to desc function when direction is not Asc', () => {
      const result = drizzleFilters.getSortDirection('invalid' as any);
      expect(result).toBe(desc);
    });
  });
});
