import {
  currencyCodeValidation,
  currencyDtoValidation,
} from '../currency.dto.validation';

describe('Currency DTO Validation', () => {
  describe('currencyCodeValidation', () => {
    it('should validate valid currency codes', () => {
      expect(currencyCodeValidation.safeParse('USD').success).toBe(true);
      expect(currencyCodeValidation.safeParse('EUR').success).toBe(true);
    });

    it('should fail on invalid currency codes', () => {
      expect(currencyCodeValidation.safeParse('US').success).toBe(false);
      expect(currencyCodeValidation.safeParse('USDT').success).toBe(false);
    });
  });

  describe('currencyDtoValidation', () => {
    it('should validate a correct currency DTO payload', () => {
      const payload = {
        code: 'GBP',
        symbol: '£',
        name: 'British Pound Sterling',
        minorUnit: 2,
      };

      const result = currencyDtoValidation.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should fail validation if minorUnit is not a number', () => {
      const payload = {
        code: 'GBP',
        symbol: '£',
        name: 'British Pound Sterling',
        minorUnit: '2',
      };

      const result = currencyDtoValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
