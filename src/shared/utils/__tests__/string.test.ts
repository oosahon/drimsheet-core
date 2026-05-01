import DomainError from '../../errors/domain.error';

import stringUtils from '../string';

class TestError extends DomainError<'test_error'> {
  constructor(cause?: any) {
    super('test_error', cause);
  }
}

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
      expect(() =>
        stringUtils.validateIsNonEmptyString('hello', TestError)
      ).not.toThrow();
    });

    it('throws InvalidString for an empty or whitespace-only string', () => {
      expect(() => stringUtils.validateIsNonEmptyString('', TestError)).toThrow(
        TestError
      );
      expect(() =>
        stringUtils.validateIsNonEmptyString('   ', TestError)
      ).toThrow(TestError);
    });

    it('throws custom error object if provided', () => {
      expect(() => stringUtils.validateIsNonEmptyString('', TestError)).toThrow(
        TestError
      );
    });

    it('throws InvalidString for non-string values', () => {
      expect(() =>
        // @ts-expect-error testing invalid types
        stringUtils.validateIsNonEmptyString(null, TestError)
      ).toThrow(TestError);

      expect(() =>
        // @ts-expect-error testing invalid types
        stringUtils.validateIsNonEmptyString(123, TestError)
      ).toThrow(TestError);
    });
  });

  describe('sanitizeAndValidate', () => {
    it('returns the string if it is within min and max length', () => {
      expect(
        stringUtils.sanitizeAndValidate('hello', { min: 3, max: 10 }, TestError)
      ).toBe('hello');
    });

    it('throws InvalidString if the value is not a string', () => {
      expect(() =>
        stringUtils.sanitizeAndValidate(
          // @ts-expect-error testing invalid types
          123,
          {
            min: 3,
            max: 10,
          },
          TestError
        )
      ).toThrow(TestError);
    });

    it('throws InvalidString if the string is less than min length', () => {
      expect(() =>
        stringUtils.sanitizeAndValidate('hi', { min: 3, max: 10 }, TestError)
      ).toThrow(TestError);
    });

    it('throws InvalidString if the string is greater than max length', () => {
      expect(() =>
        stringUtils.sanitizeAndValidate(
          'hello world',
          { min: 3, max: 10 },
          TestError
        )
      ).toThrow(TestError);
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
      expect(() =>
        stringUtils.validateUUID(validUUID, TestError)
      ).not.toThrow();
    });

    it('throws InvalidUUID for an invalid UUID', () => {
      expect(() => stringUtils.validateUUID('invalid-uuid', TestError)).toThrow(
        TestError
      );
    });
  });

  describe('toUUD', () => {
    it('returns the UUID if valid', () => {
      const validUUID = stringUtils.generateUUID();
      expect(stringUtils.toUUD(validUUID, TestError)).toBe(validUUID);
    });

    it('throws InvalidUUID if the UUID is invalid', () => {
      expect(() => stringUtils.toUUD('invalid-uuid', TestError)).toThrow(
        TestError
      );
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
        stringUtils.validateStringWithinRange(
          'hello',
          { min: 3, max: 10 },
          TestError
        )
      ).not.toThrow();
    });

    it('throws InvalidString if value is not a string', () => {
      expect(() =>
        stringUtils.validateStringWithinRange(
          // @ts-expect-error testing invalid types
          123,
          { min: 3, max: 10 },
          TestError
        )
      ).toThrow(TestError);
    });

    it('throws InvalidString if string length is not within range', () => {
      expect(() =>
        stringUtils.validateStringWithinRange(
          'hi',
          { min: 3, max: 10 },
          TestError
        )
      ).toThrow(TestError);
      expect(() =>
        stringUtils.validateStringWithinRange(
          'hello world',
          {
            min: 3,
            max: 10,
          },
          TestError
        )
      ).toThrow(TestError);
    });
  });
});
