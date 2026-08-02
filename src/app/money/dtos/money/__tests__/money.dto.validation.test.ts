import { moneyDtoValidation } from '../money.dto.validation';

describe('Money DTO Validation', () => {
  it('should validate a correct money DTO payload', () => {
    const payload = {
      amount: 1000,
      currencyCode: 'USD',
      isMinorUnit: true,
    };
    const result = moneyDtoValidation.safeParse(payload);
    expect(result.success).toBe(true);
  });

  describe('amount validation', () => {
    it('should fail if amount is missing', () => {
      const payload = {
        currencyCode: 'USD',
        isMinorUnit: true,
      };
      const result = moneyDtoValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail if amount is not a number', () => {
      const payload = {
        amount: '1000',
        currencyCode: 'USD',
        isMinorUnit: true,
      };
      const result = moneyDtoValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('currencyCode validation', () => {
    it('should fail if currencyCode is missing', () => {
      const payload = {
        amount: 1000,
        isMinorUnit: true,
      };
      const result = moneyDtoValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail if currencyCode is not exactly 3 characters', () => {
      const payloadShort = {
        amount: 1000,
        currencyCode: 'US',
        isMinorUnit: true,
      };
      const payloadLong = {
        amount: 1000,
        currencyCode: 'USDT',
        isMinorUnit: true,
      };
      const resultShort = moneyDtoValidation.safeParse(payloadShort);
      const resultLong = moneyDtoValidation.safeParse(payloadLong);
      expect(resultShort.success).toBe(false);
      expect(resultLong.success).toBe(false);
    });
  });

  describe('isMinorUnit validation', () => {
    it('should fail if isMinorUnit is missing', () => {
      const payload = {
        amount: 1000,
        currencyCode: 'USD',
      };
      const result = moneyDtoValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail if isMinorUnit is not a boolean', () => {
      const payload = {
        amount: 1000,
        currencyCode: 'USD',
        isMinorUnit: 'true',
      };
      const result = moneyDtoValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
