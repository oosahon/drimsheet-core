import numberError from '../../errors/number.error';
import numberUtils from '../number';

describe('numberUtils', () => {
  describe('toBigInt', () => {
    it('returns a BigInt for a valid integer number', () => {
      expect(numberUtils.toBigInt(42)).toBe(42n);
    });

    it('throws InvalidValue if the number is NaN', () => {
      expect(() => numberUtils.toBigInt(NaN)).toThrow(numberError.InvalidValue);
    });

    it('throws InvalidFloat if the number is a float', () => {
      expect(() => numberUtils.toBigInt(42.5)).toThrow(
        numberError.InvalidFloat
      );
    });

    it('returns a BigInt for a valid integer string', () => {
      expect(numberUtils.toBigInt('42')).toBe(42n);
    });

    it('throws InvalidValue if the string is empty or whitespace', () => {
      expect(() => numberUtils.toBigInt('')).toThrow(numberError.InvalidValue);
      expect(() => numberUtils.toBigInt('   ')).toThrow(
        numberError.InvalidValue
      );
    });

    it('throws InvalidFloat if the string contains a dot (float)', () => {
      expect(() => numberUtils.toBigInt('42.5')).toThrow(
        numberError.InvalidFloat
      );
    });

    it('returns a BigInt when passed a BigInt', () => {
      expect(numberUtils.toBigInt(42n)).toBe(42n);
    });

    it('throws InvalidValue if BigInt parsing fails', () => {
      expect(() => numberUtils.toBigInt('invalid')).toThrow(
        numberError.InvalidValue
      );
    });
  });

  describe('toFloat', () => {
    it('returns a number for a valid string', () => {
      expect(numberUtils.toFloat('42.5')).toBe(42.5);
    });

    it('returns a number for a valid number', () => {
      expect(numberUtils.toFloat(42.5)).toBe(42.5);
    });

    it('returns a number for a BigInt', () => {
      expect(numberUtils.toFloat(42n)).toBe(42);
    });

    it('throws InvalidValue if the string is empty or whitespace', () => {
      expect(() => numberUtils.toFloat('')).toThrow(numberError.InvalidValue);
      expect(() => numberUtils.toFloat('   ')).toThrow(
        numberError.InvalidValue
      );
    });

    it('throws InvalidValue if the value cannot be parsed to a number (NaN)', () => {
      expect(() => numberUtils.toFloat('invalid')).toThrow(
        numberError.InvalidValue
      );
    });
  });

  describe('toNonNegativeNumber', () => {
    it('returns a non-negative number', () => {
      expect(numberUtils.toNonNegativeNumber(42)).toBe(42);
      expect(numberUtils.toNonNegativeNumber(0)).toBe(0);
      expect(numberUtils.toNonNegativeNumber('42.5')).toBe(42.5);
    });

    it('throws NegativeValue if the number is negative', () => {
      expect(() => numberUtils.toNonNegativeNumber(-42)).toThrow(
        numberError.NegativeValue
      );
      expect(() => numberUtils.toNonNegativeNumber('-42.5')).toThrow(
        numberError.NegativeValue
      );
    });
  });

  describe('toFactor', () => {
    it('returns a factor with denominator 1 for integers', () => {
      expect(numberUtils.toFactor(42)).toEqual({
        numerator: 42,
        denominator: 1,
      });
      expect(numberUtils.toFactor('42')).toEqual({
        numerator: 42,
        denominator: 1,
      });
      expect(numberUtils.toFactor(42n)).toEqual({
        numerator: 42,
        denominator: 1,
      });
    });

    it('returns a factor for simple decimals', () => {
      expect(numberUtils.toFactor(42.5)).toEqual({
        numerator: 425,
        denominator: 10,
      });
      expect(numberUtils.toFactor(0.125)).toEqual({
        numerator: 125,
        denominator: 1000,
      });
      expect(numberUtils.toFactor('42.55')).toEqual({
        numerator: 4255,
        denominator: 100,
      });
    });

    it('returns a factor for numbers with e notation (small numbers)', () => {
      expect(numberUtils.toFactor(1e-7)).toEqual({
        numerator: 1,
        denominator: 10000000,
      });
      expect(numberUtils.toFactor(1.2e-7)).toEqual({
        numerator: 12,
        denominator: 100000000,
      });
    });

    it('returns a factor for numbers with e notation (large numbers)', () => {
      expect(numberUtils.toFactor(1e21)).toEqual({
        numerator: 1e21,
        denominator: 1,
      });
      expect(numberUtils.toFactor(1.2e21)).toEqual({
        numerator: 1.2e21,
        denominator: 1,
      });
    });

    it('throws InvalidValue for Infinity or -Infinity', () => {
      expect(() => numberUtils.toFactor(Infinity)).toThrow(
        numberError.InvalidValue
      );
      expect(() => numberUtils.toFactor(-Infinity)).toThrow(
        numberError.InvalidValue
      );
      expect(() => numberUtils.toFactor('Infinity')).toThrow(
        numberError.InvalidValue
      );
    });

    it('throws InvalidValue for unparsable factors', () => {
      expect(() => numberUtils.toFactor('invalid')).toThrow(
        numberError.InvalidValue
      );
    });
  });

  describe('isNumber', () => {
    it('returns true for a valid number', () => {
      expect(numberUtils.isNumber(42)).toBe(true);
      expect(numberUtils.isNumber(0)).toBe(true);
      expect(numberUtils.isNumber(-42.5)).toBe(true);
    });

    it('returns false for NaN', () => {
      expect(numberUtils.isNumber(NaN)).toBe(false);
    });

    it('returns false for non-number types', () => {
      expect(numberUtils.isNumber('42')).toBe(false);
      expect(numberUtils.isNumber(null)).toBe(false);
      expect(numberUtils.isNumber(undefined)).toBe(false);
      expect(numberUtils.isNumber({})).toBe(false);
      expect(numberUtils.isNumber(42n)).toBe(false);
    });
  });

  describe('validateNumber', () => {
    it('does not throw for a valid number', () => {
      expect(() => numberUtils.validateNumber(42)).not.toThrow();
      expect(() => numberUtils.validateNumber('42.5')).not.toThrow();
    });

    it('throws InvalidValue for an invalid number', () => {
      expect(() => numberUtils.validateNumber('invalid')).toThrow(
        numberError.InvalidValue
      );
    });
  });

  describe('isInteger', () => {
    it('returns true for an integer', () => {
      expect(numberUtils.isInteger(42)).toBe(true);
      expect(numberUtils.isInteger('42')).toBe(true);
    });

    it('returns false for a float', () => {
      expect(numberUtils.isInteger(42.5)).toBe(false);
      expect(numberUtils.isInteger('42.5')).toBe(false);
    });
  });

  describe('validateInteger', () => {
    it('does not throw for an integer', () => {
      expect(() => numberUtils.validateInteger(42)).not.toThrow();
      expect(() => numberUtils.validateInteger('42')).not.toThrow();
    });

    it('throws InvalidFloat for a float', () => {
      expect(() => numberUtils.validateInteger(42.5)).toThrow(
        numberError.InvalidFloat
      );
      expect(() => numberUtils.validateInteger('42.5')).toThrow(
        numberError.InvalidFloat
      );
    });

    it('throws InvalidValue for invalid format', () => {
      expect(() => numberUtils.validateInteger('invalid')).toThrow(
        numberError.InvalidValue
      );
    });
  });
  describe('isPositiveNumber', () => {
    it('returns true for positive numbers', () => {
      expect(numberUtils.isPositiveNumber(42)).toBe(true);
      expect(numberUtils.isPositiveNumber('42.5')).toBe(true);
      expect(numberUtils.isPositiveNumber(42n)).toBe(true);
    });

    it('returns false for zero or negative numbers', () => {
      expect(numberUtils.isPositiveNumber(0)).toBe(false);
      expect(numberUtils.isPositiveNumber(-42)).toBe(false);
      expect(numberUtils.isPositiveNumber('-42.5')).toBe(false);
    });
  });

  describe('validatePositiveNumber', () => {
    it('does not throw for positive numbers', () => {
      expect(() => numberUtils.validatePositiveNumber(42)).not.toThrow();
      expect(() => numberUtils.validatePositiveNumber('42.5')).not.toThrow();
    });

    it('throws NonPositiveValue for zero or negative numbers', () => {
      expect(() => numberUtils.validatePositiveNumber(0)).toThrow(
        numberError.NonPositiveValue
      );
      expect(() => numberUtils.validatePositiveNumber(-42)).toThrow(
        numberError.NonPositiveValue
      );
    });

    it('throws custom error object if provided', () => {
      const customError = new Error('Custom error');
      expect(() => numberUtils.validatePositiveNumber(0, customError)).toThrow(
        customError
      );
    });
  });

  describe('isNonNegativeNumber', () => {
    it('returns true for zero and positive numbers', () => {
      expect(numberUtils.isNonNegativeNumber(0)).toBe(true);
      expect(numberUtils.isNonNegativeNumber(42)).toBe(true);
      expect(numberUtils.isNonNegativeNumber('42.5')).toBe(true);
    });

    it('returns false for negative numbers', () => {
      expect(numberUtils.isNonNegativeNumber(-42)).toBe(false);
      expect(numberUtils.isNonNegativeNumber('-42.5')).toBe(false);
    });
  });

  describe('validateNonNegativeNumber', () => {
    it('does not throw for zero and positive numbers', () => {
      expect(() => numberUtils.validateNonNegativeNumber(0)).not.toThrow();
      expect(() => numberUtils.validateNonNegativeNumber(42)).not.toThrow();
      expect(() => numberUtils.validateNonNegativeNumber('42.5')).not.toThrow();
    });

    it('throws NegativeValue for negative numbers', () => {
      expect(() => numberUtils.validateNonNegativeNumber(-42)).toThrow(
        numberError.NegativeValue
      );
    });

    it('throws custom error object if provided', () => {
      const customError = new Error('Custom negative error');
      expect(() =>
        numberUtils.validateNonNegativeNumber(-42, customError)
      ).toThrow(customError);
    });
  });
});
