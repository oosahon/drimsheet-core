import { IPaginationDto } from '../pagination.dto';
import paginationMapper from '../pagination.dto.mapper';

describe('Pagination DTO Mapper', () => {
  describe('fromDto', () => {
    it('should map pagination DTO to pagination params correctly', () => {
      const dto: IPaginationDto = {
        limit: 10,
        page: 3,
        orderBy: 'createdAt',
        sortDirection: 'asc',
        search: 'test query',
      };

      const result = paginationMapper.fromDto(dto);

      expect(result).toEqual({
        limit: 10,
        offset: 20, // (3 - 1) * 10
        orderBy: 'createdAt',
        sortDirection: 'asc',
        search: 'test query',
      });
    });

    it('should map successfully with undefined optional fields', () => {
      const dto: IPaginationDto = {};

      const result = paginationMapper.fromDto(dto);

      expect(result.limit).toBeUndefined();
      expect(result.offset).toBe(0);
      expect(result.orderBy).toBeUndefined();
      expect(result.sortDirection).toBeUndefined();
      expect(result.search).toBeUndefined();
    });
  });
});
