import numberUtils from '../number';
import { AppError } from '../../value-objects/error';

describe('numberUtils', () => {
  describe('toBigInt', () => {
    it('returns a BigInt for a valid integer number', () => {
      expect(numberUtils.toBigInt(42)).toBe(42n);
    });

    it('throws AppError if the number is NaN', () => {
      expect(() => numberUtils.toBigInt(NaN)).toThrow(AppError);
    });

    it('throws AppError if the number is a float', () => {
      expect(() => numberUtils.toBigInt(42.5)).toThrow(AppError);
    });

    it('returns a BigInt for a valid integer string', () => {
      expect(numberUtils.toBigInt('42')).toBe(42n);
    });

    it('throws AppError if the string is empty or whitespace', () => {
      expect(() => numberUtils.toBigInt('')).toThrow(AppError);
      expect(() => numberUtils.toBigInt('   ')).toThrow(AppError);
    });

    it('throws AppError if the string contains a dot (float)', () => {
      expect(() => numberUtils.toBigInt('42.5')).toThrow(AppError);
    });

    it('returns a BigInt when passed a BigInt', () => {
      expect(numberUtils.toBigInt(42n)).toBe(42n);
    });

    it('throws AppError if BigInt parsing fails', () => {
      expect(() => numberUtils.toBigInt('invalid')).toThrow(AppError);
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

    it('throws AppError if the string is empty or whitespace', () => {
      expect(() => numberUtils.toFloat('')).toThrow(AppError);
      expect(() => numberUtils.toFloat('   ')).toThrow(AppError);
    });

    it('throws AppError if the value cannot be parsed to a number (NaN)', () => {
      expect(() => numberUtils.toFloat('invalid')).toThrow(AppError);
    });
  });

  describe('toNonNegativeNumber', () => {
    it('returns a non-negative number', () => {
      expect(numberUtils.toNonNegativeNumber(42)).toBe(42);
      expect(numberUtils.toNonNegativeNumber(0)).toBe(0);
      expect(numberUtils.toNonNegativeNumber('42.5')).toBe(42.5);
    });

    it('throws AppError if the number is negative', () => {
      expect(() => numberUtils.toNonNegativeNumber(-42)).toThrow(AppError);
      expect(() => numberUtils.toNonNegativeNumber('-42.5')).toThrow(AppError);
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

    it('throws AppError for Infinity or -Infinity', () => {
      expect(() => numberUtils.toFactor(Infinity)).toThrow(AppError);
      expect(() => numberUtils.toFactor(-Infinity)).toThrow(AppError);
      expect(() => numberUtils.toFactor('Infinity')).toThrow(AppError);
    });

    it('throws AppError for unparsable factors', () => {
      expect(() => numberUtils.toFactor('invalid')).toThrow(AppError);
    });
  });
});
