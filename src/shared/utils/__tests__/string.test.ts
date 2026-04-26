import { AppError } from '../../value-objects/error';
import stringUtils from '../string';

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
      // @ts-expect-error testing invalid types
      expect(stringUtils.isNonEmptyString(null)).toBe(false);
      // @ts-expect-error testing invalid types
      expect(stringUtils.isNonEmptyString(123)).toBe(false);
      // @ts-expect-error testing invalid types
      expect(stringUtils.isNonEmptyString({})).toBe(false);
    });
  });

  describe('validateIsNonEmptyString', () => {
    it('does not throw for a non-empty string', () => {
      expect(() => stringUtils.validateIsNonEmptyString('hello')).not.toThrow();
    });

    it('throws AppError for an empty or whitespace-only string', () => {
      expect(() => stringUtils.validateIsNonEmptyString('')).toThrow(AppError);
      expect(() => stringUtils.validateIsNonEmptyString('   ')).toThrow(
        AppError
      );
    });

    it('throws AppError with custom message', () => {
      expect(() =>
        stringUtils.validateIsNonEmptyString('', 'Custom error message')
      ).toThrow(AppError);

      try {
        stringUtils.validateIsNonEmptyString('', 'Custom error message');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).message).toBe('Custom error message');
        expect((error as AppError).cause).toEqual({ cause: '' });
      }
    });

    it('throws AppError for non-string values', () => {
      // @ts-expect-error testing invalid types
      expect(() => stringUtils.validateIsNonEmptyString(null)).toThrow(
        AppError
      );
      // @ts-expect-error testing invalid types
      expect(() => stringUtils.validateIsNonEmptyString(123)).toThrow(AppError);
    });
  });

  describe('sanitizeAndValidate', () => {
    it('returns the string if it is within min and max length', () => {
      expect(
        stringUtils.sanitizeAndValidate('hello', { min: 3, max: 10 })
      ).toBe('hello');
    });

    it('throws AppError if the value is not a string', () => {
      expect(() =>
        // @ts-expect-error testing invalid types
        stringUtils.sanitizeAndValidate(123, {
          min: 3,
          max: 10,
        })
      ).toThrow(AppError);
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

  describe('isUrl', () => {
    it('returns true for a valid URL', () => {
      expect(stringUtils.isUrl('https://example.com')).toBe(true);
      expect(stringUtils.isUrl('http://www.test.org/path?query=1')).toBe(true);
    });

    it('returns false for an invalid URL', () => {
      expect(stringUtils.isUrl('not-a-url')).toBe(false);
      expect(stringUtils.isUrl('htp://wrong-scheme')).toBe(false);
      expect(stringUtils.isUrl('')).toBe(false);
    });

    it('returns false for non-string values', () => {
      // @ts-expect-error testing invalid types
      expect(stringUtils.isUrl(null)).toBe(false);
      // @ts-expect-error testing invalid types
      expect(stringUtils.isUrl(123)).toBe(false);
      // @ts-expect-error testing invalid types
      expect(stringUtils.isUrl({})).toBe(false);
    });
  });

  describe('isStringWithinRange', () => {
    it('returns true if string length is within min and max', () => {
      expect(
        stringUtils.isStringWithinRange('hello', { min: 3, max: 10 })
      ).toBe(true);
      expect(stringUtils.isStringWithinRange('123', { min: 3, max: 3 })).toBe(
        true
      );
    });

    it('returns false if value is not a string', () => {
      // @ts-expect-error testing invalid types
      expect(stringUtils.isStringWithinRange(123, { min: 3, max: 10 })).toBe(
        false
      );
    });

    it('returns false if string is shorter than min', () => {
      expect(stringUtils.isStringWithinRange('hi', { min: 3, max: 10 })).toBe(
        false
      );
    });

    it('returns false if string is longer than max', () => {
      expect(
        stringUtils.isStringWithinRange('hello world', { min: 3, max: 10 })
      ).toBe(false);
    });

    it('sanitizes the string if sanitize option is true', () => {
      expect(
        stringUtils.isStringWithinRange('  hi  ', {
          min: 3,
          max: 10,
          sanitize: true,
        })
      ).toBe(false);
      expect(
        stringUtils.isStringWithinRange('  hello  ', {
          min: 3,
          max: 10,
          sanitize: true,
        })
      ).toBe(true);
      expect(
        stringUtils.isStringWithinRange('  hello world  ', {
          min: 3,
          max: 10,
          sanitize: true,
        })
      ).toBe(false);
    });
  });

  describe('validateStringWithinRange', () => {
    it('does not throw if string is within min and max', () => {
      expect(() =>
        stringUtils.validateStringWithinRange('hello', { min: 3, max: 10 })
      ).not.toThrow();
    });

    it('throws AppError if value is not a string', () => {
      expect(() =>
        // @ts-expect-error testing invalid types
        stringUtils.validateStringWithinRange(123, { min: 3, max: 10 })
      ).toThrow(AppError);
    });

    it('throws AppError if string length is not within range', () => {
      expect(() =>
        stringUtils.validateStringWithinRange('hi', { min: 3, max: 10 })
      ).toThrow(AppError);
      expect(() =>
        stringUtils.validateStringWithinRange('hello world', {
          min: 3,
          max: 10,
        })
      ).toThrow(AppError);
    });
  });
});
