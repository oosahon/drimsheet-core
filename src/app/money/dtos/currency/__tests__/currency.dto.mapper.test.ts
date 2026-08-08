import currencyMapper from '@app/money/dtos/currency/currency.dto.mapper';

describe('Currency DTO Mapper', () => {
  describe('fromInterface', () => {
    it('should map a valid currency code to currency object', () => {
      const result = currencyMapper.fromInterface('USD');
      expect(result).toBeDefined();
      expect(result.code).toBe('USD');
      expect(result.name).toBe('US Dollar');
    });

    it('should throw an error for invalid currency code', () => {
      expect(() => currencyMapper.fromInterface('INVALID')).toThrow();
    });
  });
});
