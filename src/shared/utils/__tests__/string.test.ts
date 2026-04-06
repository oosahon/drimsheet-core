import stringUtils from '../string';
import { AppError } from '../../value-objects/error';

describe('stringUtils', () => {
  describe('isNonEmptyString', () => {
    it('returns true for a non-empty string', () => {
      expect(stringUtils.isNonEmptyString('hello')).toBe(true);
      expect(stringUtils.isNonEmptyString('a')).toBe(true);
    });

    it('returns false for an empty string or whitespace-only string', () => {
      expect(stringUtils.isNonEmptyString('')).toBe(false);
      expect(stringUtils.isNonEmptyString('   ')).toBe(false);
    });

    it('returns false for non-string values', () => {
      expect(stringUtils.isNonEmptyString(null as any)).toBe(false);
      expect(stringUtils.isNonEmptyString(123 as any)).toBe(false);
      expect(stringUtils.isNonEmptyString({} as any)).toBe(false);
    });
  });

  describe('sanitizeAndValidate', () => {
    it('returns the string if it is within min and max length', () => {
      expect(
        stringUtils.sanitizeAndValidate('hello', { min: 3, max: 10 })
      ).toBe('hello');
    });

    it('throws AppError if the string is less than min length', () => {
      expect(() =>
        stringUtils.sanitizeAndValidate('hi', { min: 3, max: 10 })
      ).toThrow(AppError);
    });

    it('throws AppError if the string is greater than max length', () => {
      expect(() =>
        stringUtils.sanitizeAndValidate('hello world', { min: 3, max: 10 })
      ).toThrow(AppError);
    });
  });

  describe('generateUUID', () => {
    it('generates a valid UUID', () => {
      const generated = stringUtils.generateUUID();
      expect(stringUtils.isUUID(generated)).toBe(true);
    });

    it('generates unique UUIDs', () => {
      const id1 = stringUtils.generateUUID();
      const id2 = stringUtils.generateUUID();
      expect(id1).not.toBe(id2);
    });
  });

  describe('isUUID', () => {
    it('returns true for a valid UUID', () => {
      const validUUID = stringUtils.generateUUID();
      expect(stringUtils.isUUID(validUUID)).toBe(true);
    });

    it('returns false for an invalid UUID', () => {
      expect(stringUtils.isUUID('invalid-uuid')).toBe(false);
      expect(stringUtils.isUUID('')).toBe(false);
      expect(stringUtils.isUUID('123e4567-e89b-12d3-a456-42661417400')).toBe(
        false
      );
    });
  });

  describe('validateUUID', () => {
    it('does not throw for a valid UUID', () => {
      const validUUID = stringUtils.generateUUID();
      expect(() => stringUtils.validateUUID(validUUID)).not.toThrow();
    });

    it('throws AppError for an invalid UUID', () => {
      expect(() => stringUtils.validateUUID('invalid-uuid')).toThrow(AppError);
    });
  });

  describe('toUUD', () => {
    it('returns the UUID if valid', () => {
      const validUUID = stringUtils.generateUUID();
      expect(stringUtils.toUUD(validUUID)).toBe(validUUID);
    });

    it('throws AppError if the UUID is invalid', () => {
      expect(() => stringUtils.toUUD('invalid-uuid')).toThrow(AppError);
    });
  });

  describe('isNumeric', () => {
    it('returns true for numeric strings', () => {
      expect(stringUtils.isNumeric('123')).toBe(true);
      expect(stringUtils.isNumeric('0')).toBe(true);
      expect(stringUtils.isNumeric('9876543210')).toBe(true);
    });

    it('returns false for non-numeric strings', () => {
      expect(stringUtils.isNumeric('123a')).toBe(false);
      expect(stringUtils.isNumeric('a123')).toBe(false);
      expect(stringUtils.isNumeric(' 123 ')).toBe(false);
      expect(stringUtils.isNumeric('')).toBe(false);
      expect(stringUtils.isNumeric('-123')).toBe(false);
      expect(stringUtils.isNumeric('123.45')).toBe(false);
    });
  });
});
