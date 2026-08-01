import {
  paginationDtoValidation,
  paginationSortDirectionValidationSchema,
} from '../pagination.dto.validation';

describe('Pagination DTO Validation', () => {
  describe('paginationSortDirectionValidationSchema', () => {
    it('should validate valid sort directions', () => {
      expect(
        paginationSortDirectionValidationSchema.safeParse('asc').success
      ).toBe(true);
      expect(
        paginationSortDirectionValidationSchema.safeParse('desc').success
      ).toBe(true);
    });

    it('should fail on invalid sort direction', () => {
      expect(
        paginationSortDirectionValidationSchema.safeParse('invalid_direction')
          .success
      ).toBe(false);
    });
  });

  describe('paginationDtoValidation', () => {
    it('should validate a correct pagination query payload', () => {
      const payload = {
        limit: 50,
        page: 2,
        orderBy: 'name',
        sortDirection: 'desc',
        search: 'search term',
      };

      const result = paginationDtoValidation.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should validate with optional fields omitted', () => {
      const payload = {};

      const result = paginationDtoValidation.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should fail if limit is less than 1', () => {
      const payload = {
        limit: 0,
      };

      const result = paginationDtoValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail if limit is greater than 200', () => {
      const payload = {
        limit: 201,
      };

      const result = paginationDtoValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail if page is less than 1', () => {
      const payload = {
        page: 0,
      };

      const result = paginationDtoValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
