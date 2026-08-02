import { getBanksQueryValidationSchema } from '../bank-directory.dto.validation';

describe('Bank Directory DTO Validation', () => {
  describe('getBanksQueryValidationSchema', () => {
    it('should validate a valid lowercase country code and transform it to uppercase', () => {
      const result = getBanksQueryValidationSchema.safeParse({
        countryCode: 'ng',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.countryCode).toBe('NG');
      }
    });

    it('should validate a valid uppercase country code', () => {
      const result = getBanksQueryValidationSchema.safeParse({
        countryCode: 'US',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.countryCode).toBe('US');
      }
    });

    it('should fail validation if country code is an invalid string', () => {
      const result = getBanksQueryValidationSchema.safeParse({
        countryCode: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should fail validation if country code is not a string (e.g., a number)', () => {
      const result = getBanksQueryValidationSchema.safeParse({
        countryCode: 123,
      });
      expect(result.success).toBe(false);
    });

    it('should fail validation if country code is missing', () => {
      const result = getBanksQueryValidationSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
