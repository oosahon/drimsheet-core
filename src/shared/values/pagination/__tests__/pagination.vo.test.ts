import paginationValue from '@shared/values/pagination/pagination.vo';
import { EPaginationSortDirection } from '@shared/values/pagination/types/pagination.types';

describe('paginationValue', () => {
  describe('getLimit', () => {
    it('should return the default limit of 10 when no limit is provided', () => {
      expect(paginationValue.getLimit()).toBe(10);
    });

    it('should return the default limit of 10 when limit is 0 (falsy)', () => {
      expect(paginationValue.getLimit(0)).toBe(10);
    });

    it('should return the provided limit when it is a valid integer', () => {
      expect(paginationValue.getLimit(50)).toBe(50);
    });

    it('should cap the limit at 200 when limit exceeds 200', () => {
      expect(paginationValue.getLimit(201)).toBe(200);
      expect(paginationValue.getLimit(1000)).toBe(200);
    });

    it('should return 200 when limit is exactly 200', () => {
      expect(paginationValue.getLimit(200)).toBe(200);
    });

    it('should throw PaginationError when limit is a non-integer number', () => {
      expect(() => paginationValue.getLimit(10.5)).toThrow();
    });
  });

  describe('getOffset', () => {
    it('should return the default offset of 0 when no offset is provided', () => {
      expect(paginationValue.getOffset()).toBe(0);
    });

    it('should return the default offset of 0 when offset is 0 (falsy)', () => {
      expect(paginationValue.getOffset(0)).toBe(0);
    });

    it('should return the provided offset when it is a valid integer', () => {
      expect(paginationValue.getOffset(100)).toBe(100);
    });

    it('should cap the offset at 2000 when offset exceeds 2000', () => {
      expect(paginationValue.getOffset(2001)).toBe(2000);
      expect(paginationValue.getOffset(9999)).toBe(2000);
    });

    it('should return 2000 when offset is exactly 2000', () => {
      expect(paginationValue.getOffset(2000)).toBe(2000);
    });

    it('should throw PaginationError when offset is a non-integer number', () => {
      expect(() => paginationValue.getOffset(10.5)).toThrow();
    });
  });

  describe('getPage', () => {
    it('should return page 1 when offset is 0', () => {
      expect(paginationValue.getPage(20, 0)).toBe(1);
    });

    it('should return the correct page number based on limit and offset', () => {
      expect(paginationValue.getPage(20, 20)).toBe(2);
      expect(paginationValue.getPage(20, 40)).toBe(3);
      expect(paginationValue.getPage(10, 30)).toBe(4);
    });

    it('should throw PaginationError when limit is negative', () => {
      expect(() => paginationValue.getPage(-1, 0)).toThrow();
    });

    it('should throw PaginationError when offset is negative', () => {
      expect(() => paginationValue.getPage(20, -1)).toThrow();
    });
  });

  describe('getResponseMeta', () => {
    it('should return correct metadata with default limit and offset', () => {
      const meta = paginationValue.getResponseMeta(100, {});

      expect(meta.limit).toBe(10);
      expect(meta.page).toBe(1);
      expect(meta.total).toBe(100);
      expect(meta.totalPages).toBe(10);
    });

    it('should return correct metadata with custom limit and offset', () => {
      const meta = paginationValue.getResponseMeta(100, {
        limit: 10,
        offset: 20,
      });

      expect(meta.limit).toBe(10);
      expect(meta.page).toBe(3);
      expect(meta.total).toBe(100);
      expect(meta.totalPages).toBe(10);
    });

    it('should return totalPages of 0 when total is 0', () => {
      const meta = paginationValue.getResponseMeta(0, {});

      expect(meta.total).toBe(0);
      expect(meta.totalPages).toBe(0);
    });

    it('should round totalPages up when there is a remainder', () => {
      const meta = paginationValue.getResponseMeta(21, { limit: 10 });

      expect(meta.totalPages).toBe(3);
    });

    it('should return a frozen object', () => {
      const meta = paginationValue.getResponseMeta(100, {});

      expect(Object.isFrozen(meta)).toBe(true);
    });
  });

  describe('getPaginatedResponse', () => {
    it('should return a paginated response with data and meta', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const response = paginationValue.getPaginatedResponse(data, 50, {
        limit: 10,
        offset: 0,
      });

      expect(response.data).toEqual(data);
      expect(response.meta.total).toBe(50);
      expect(response.meta.limit).toBe(10);
      expect(response.meta.page).toBe(1);
      expect(response.meta.totalPages).toBe(5);
    });

    it('should return a frozen response object', () => {
      const response = paginationValue.getPaginatedResponse([], 0, {});

      expect(Object.isFrozen(response)).toBe(true);
    });

    it('should handle an empty data array', () => {
      const response = paginationValue.getPaginatedResponse([], 0, {});

      expect(response.data).toEqual([]);
      expect(response.meta.total).toBe(0);
    });
  });

  describe('getSortDirection', () => {
    it('should return "desc" as the default when no direction is provided', () => {
      expect(paginationValue.getSortDirection()).toBe(
        EPaginationSortDirection.Desc
      );
    });

    it('should return "asc" when asc direction is provided', () => {
      expect(
        paginationValue.getSortDirection(EPaginationSortDirection.Asc)
      ).toBe(EPaginationSortDirection.Asc);
    });

    it('should return "desc" when desc direction is explicitly provided', () => {
      expect(
        paginationValue.getSortDirection(EPaginationSortDirection.Desc)
      ).toBe(EPaginationSortDirection.Desc);
    });
  });

  describe('pageToOffset', () => {
    it('should return 0 when page is 1', () => {
      expect(paginationValue.pageToOffset(1, 10)).toBe(0);
    });

    it('should return the correct offset for a given page and limit', () => {
      expect(paginationValue.pageToOffset(2, 10)).toBe(10);
      expect(paginationValue.pageToOffset(3, 10)).toBe(20);
      expect(paginationValue.pageToOffset(4, 20)).toBe(60);
    });

    it('should default to page 1 (offset 0) when page is undefined', () => {
      expect(paginationValue.pageToOffset(undefined, 10)).toBe(0);
    });

    it('should default to page 1 (offset 0) when page is 0 (falsy)', () => {
      expect(paginationValue.pageToOffset(0, 10)).toBe(0);
    });

    it('should use the default limit of 10 when limit is not provided', () => {
      // page=2, default limit=10 → offset = (2-1)*10 = 10
      expect(paginationValue.pageToOffset(2)).toBe(10);
    });
  });
});
