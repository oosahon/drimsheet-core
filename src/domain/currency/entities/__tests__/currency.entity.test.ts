import currencyEntity from '../currency.entity';

describe('Currency Domain Entity', () => {
  describe('isValidCode', () => {
    it('should return true for a valid currency code', () => {
      expect(currencyEntity.isValidCode('USD')).toBe(true);
      expect(currencyEntity.isValidCode('NGN')).toBe(true);
      expect(currencyEntity.isValidCode('EUR')).toBe(true);
      expect(currencyEntity.isValidCode('GBP')).toBe(true);
    });

    it('should return false for invalid formats (not 3 chars)', () => {
      expect(currencyEntity.isValidCode('US')).toBe(false);
      expect(currencyEntity.isValidCode('USDD')).toBe(false);
      expect(currencyEntity.isValidCode('')).toBe(false);
    });

    it('should return false for non-uppercase codes', () => {
      expect(currencyEntity.isValidCode('usd')).toBe(false);
      expect(currencyEntity.isValidCode('Usd')).toBe(false);
    });

    it('should return false for non-string types', () => {
      expect(currencyEntity.isValidCode(123 as unknown as string)).toBe(false);
      expect(currencyEntity.isValidCode({} as unknown as string)).toBe(false);
      expect(currencyEntity.isValidCode(null as unknown as string)).toBe(false);
      expect(currencyEntity.isValidCode(undefined as unknown as string)).toBe(
        false
      );
    });

    it('should return false for an unknown/invalid 3-letter code', () => {
      expect(currencyEntity.isValidCode('ZZZ')).toBe(false);
    });

    it('should return false if Intl.DisplayNames throws (e.g. malformed codes)', () => {
      expect(currencyEntity.isValidCode('123')).toBe(false);
      expect(currencyEntity.isValidCode('$$$')).toBe(false);
    });
  });

  describe('isValidMinorUnit', () => {
    it('should return true for valid minor units (0 to 8)', () => {
      expect(currencyEntity.isValidMinorUnit(0)).toBe(true);
      expect(currencyEntity.isValidMinorUnit(2)).toBe(true);
      expect(currencyEntity.isValidMinorUnit(8)).toBe(true);
    });

    it('should return false for minor units less than 0 or greater than 8', () => {
      expect(currencyEntity.isValidMinorUnit(-1)).toBe(false);
      expect(currencyEntity.isValidMinorUnit(9)).toBe(false);
    });

    it('should return false for non-integer numbers', () => {
      expect(currencyEntity.isValidMinorUnit(2.5)).toBe(false);
    });
  });

  describe('validateCode', () => {
    it('should not throw for a valid currency code', () => {
      expect(() => currencyEntity.validateCode('USD')).not.toThrow();
    });

    it('should throw AppError for an invalid currency code', () => {
      expect(() => currencyEntity.validateCode('INVALID')).toThrow();
      expect(() => currencyEntity.validateCode('usd')).toThrow();

      try {
        currencyEntity.validateCode('usd');
        fail('Should have thrown');
      } catch (e: any) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toBe('currency_error_currency_invalid_code');
        expect(e.cause).toEqual({ code: 'usd' });
      }
    });
  });

  describe('normalizeCode', () => {
    it('should return normalized code for a valid uppercase code', () => {
      expect(currencyEntity.normalizeCode('USD')).toBe('USD');
    });

    it('should return normalized code for a lowercase code', () => {
      expect(currencyEntity.normalizeCode('usd')).toBe('USD');
    });
  });

  describe('getByCode', () => {
    it('should return the currency if found in system currencies', () => {
      const currency = currencyEntity.getByCode('USD');
      expect(currency).toBeDefined();
      expect(currency.code).toBe('USD');
      expect(currency.name).toBe('US Dollar');
    });

    it('should throw an AppError if currency code is an invalid format', () => {
      expect(() => currencyEntity.getByCode('invalid')).toThrow();
    });

    it('should throw an AppError if currency format is valid but not found in system currencies', () => {
      // BBD is a valid ISO currency but not in our SYSTEM_CURRENCIES
      expect(() => currencyEntity.getByCode('BBD')).toThrow();
    });
  });
});
