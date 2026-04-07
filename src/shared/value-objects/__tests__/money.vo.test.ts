import money from '../money.vo';
import { AppError } from '../error';
import mockCurrencies from '../__mocks__/currencies.mock';

describe('Money Value Object', () => {
  const NGN = mockCurrencies.NGN;
  const USD = mockCurrencies.USD;
  const JPY = mockCurrencies.JPY;

  describe('make', () => {
    it('should create money from minor units correctly', () => {
      const result = money.make(BigInt(100), NGN, true);
      expect(result.amount).toBe(BigInt(100));
      expect(result.currency.code).toBe('NGN');
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('should support minor units as numbers', () => {
      const result = money.make(100, NGN, true);
      expect(result.amount).toBe(BigInt(100));
    });

    it('should throw an error if minor unit is fractional', () => {
      expect(() => money.make(10.5, NGN, true)).toThrow(
        new AppError('Provide a non-fractional amount', { cause: 10.5 })
      );
    });

    it('should create money from major units correctly', () => {
      const result = money.make(10.5, NGN, false);
      expect(result.amount).toBe(BigInt(1050));
    });

    it('should correctly handle float precision drift in major units', () => {
      const result = money.make(1.15, NGN, false);
      expect(result.amount).toBe(BigInt(115));
    });

    it('should handle zero decimal currencies like JPY', () => {
      const result = money.make(500, JPY, false);
      expect(result.amount).toBe(BigInt(500));
    });

    it('should throw an error for an invalid currency code', () => {
      const fakeCurrency = { ...NGN, code: 'FAKE' };
      expect(() => money.make(100, fakeCurrency, true)).toThrow(
        new AppError('Invalid currency code', { cause: 'FAKE' })
      );
    });

    it('should throw AppError on unsafe integer normalizations', () => {
      expect(() => money.make(Infinity, NGN, false)).toThrow(AppError);
    });
  });

  describe('makeZeroAmount', () => {
    it('should create a 0 balance for the given currency', () => {
      const zero = money.makeZeroAmount(USD);
      expect(zero.amount).toBe(BigInt(0));
      expect(zero.currency.code).toBe('USD');
    });
  });

  describe('isSameCurrency', () => {
    it('should return false for empty arguments', () => {
      expect(money.isSameCurrency()).toBe(false);
    });

    it('should return true if all currencies are identical', () => {
      const gbp1 = money.make(BigInt(100), USD, true);
      const gbp2 = money.make(BigInt(250), USD, true);
      expect(money.isSameCurrency(gbp1, gbp2)).toBe(true);
    });

    it('should return false if there is a mismatch', () => {
      const m1 = money.make(BigInt(100), USD, true);
      const m2 = money.make(BigInt(100), NGN, true);
      expect(money.isSameCurrency(m1, m2)).toBe(false);
    });
  });

  describe('add', () => {
    it('should sum multiple money objects of the same currency', () => {
      const m1 = money.make(BigInt(100), NGN, true);
      const m2 = money.make(BigInt(150), NGN, true);
      const m3 = money.make(BigInt(50), NGN, true);

      const result = money.add(m1, m2, m3);
      expect(result.amount).toBe(BigInt(300));
      expect(result.currency.code).toBe('NGN');
    });

    it('should throw if no arguments are provided', () => {
      expect(() => money.add()).toThrow(
        new AppError('Provide at least one parameter for addition')
      );
    });

    it('should throw if mixed currencies are provided', () => {
      const m1 = money.make(BigInt(100), NGN, true);
      const m2 = money.make(BigInt(100), USD, true);
      expect(() => money.add(m1, m2)).toThrow(
        new AppError('Please provide money objects with the same currency', {
          cause: [m1, m2],
        })
      );
    });
  });

  describe('subtract', () => {
    it('should subtract multiple money objects correctly', () => {
      const m1 = money.make(BigInt(500), USD, true);
      const m2 = money.make(BigInt(150), USD, true);
      const m3 = money.make(BigInt(50), USD, true);

      const result = money.subtract(m1, m2, m3);
      expect(result.amount).toBe(BigInt(300));
      expect(result.currency.code).toBe('USD');
    });

    it('should throw if no arguments are provided', () => {
      expect(() => money.subtract()).toThrow(
        new AppError('Provide at least one parameter for subtraction')
      );
    });

    it('should throw if mixed currencies are provided', () => {
      const m1 = money.make(BigInt(100), NGN, true);
      const m2 = money.make(BigInt(100), USD, true);
      expect(() => money.subtract(m1, m2)).toThrow(
        new AppError('Please provide money objects with the same currency', {
          cause: [m1, m2],
        })
      );
    });
  });

  describe('multiply', () => {
    it('should correctly multiply money by an exact fraction', () => {
      const m1 = money.make(BigInt(1000), NGN, true);

      const result = money.multiply(m1, { numerator: 3, denominator: 4 });
      expect(result.amount).toBe(BigInt(750));
      expect(result.currency.code).toBe('NGN');
    });

    it('should truncate decimal results like BigInts normally do', () => {
      const m1 = money.make(BigInt(1000), NGN, true);

      const result = money.multiply(m1, { numerator: 1, denominator: 3 });
      expect(result.amount).toBe(BigInt(333));
    });

    it('should throw error on invalid numerator or denominator', () => {
      const m1 = money.make(BigInt(1000), NGN, true);

      expect(() =>
        money.multiply(m1, { numerator: 1, denominator: 0 })
      ).toThrow(
        new AppError('Please provide a valid factor', {
          cause: { numerator: 1, denominator: 0 },
        })
      );

      expect(() =>
        money.multiply(m1, { numerator: 1.5, denominator: 2 })
      ).toThrow(
        new AppError('Please provide a valid factor', {
          cause: { numerator: 1.5, denominator: 2 },
        })
      );
    });
  });

  describe('divide', () => {
    it('should divide money up, retaining the remainder explicitly', () => {
      const m1 = money.make(BigInt(1000), NGN, true);

      const result = money.divide(m1, { numerator: 3, denominator: 1 });

      expect(result.value.amount).toBe(BigInt(333));
      expect(result.remainder.amount).toBe(BigInt(1));
    });

    it('should divide correctly by a fractional factor', () => {
      const m1 = money.make(BigInt(1000), NGN, true);

      const result = money.divide(m1, { numerator: 1, denominator: 2 });
      expect(result.value.amount).toBe(BigInt(2000));
      expect(result.remainder.amount).toBe(BigInt(0));
    });

    it('should throw on division by zero', () => {
      const m1 = money.make(BigInt(100), USD, true);

      expect(() => money.divide(m1, { numerator: 0, denominator: 1 })).toThrow(
        new AppError('Cannot divide by zero', {
          cause: { numerator: 0, denominator: 1 },
        })
      );
    });

    it('should throw if divisor object is invalid otherwise', () => {
      const m1 = money.make(BigInt(100), USD, true);

      expect(() => money.divide(m1, { numerator: 1, denominator: 0 })).toThrow(
        new AppError('Please provide a valid factor', {
          cause: { numerator: 1, denominator: 0 },
        })
      );
    });
  });

  describe('validate', () => {
    it('should not throw for a valid money object', () => {
      const m = money.make(100, USD, true);
      expect(() => money.validate(m)).not.toThrow();
    });

    it('should throw if amount is not a bigint', () => {
      const m = { amount: 100, currency: USD } as any;
      expect(() => money.validate(m)).toThrow(
        new AppError('Invalid amount', { cause: 100 })
      );
    });

    it('should throw if currency code is invalid', () => {
      const fakeCurrency = { ...USD, code: 'FAKE' };
      const m = { amount: BigInt(100), currency: fakeCurrency } as any;
      expect(() => money.validate(m)).toThrow(
        new AppError('Invalid currency code', { cause: 'FAKE' })
      );
    });
  });

  describe('equals', () => {
    it('should return true for identical money objects', () => {
      const m1 = money.make(100, USD, true);
      const m2 = money.make(100, USD, true);
      expect(money.equals(m1, m2)).toBe(true);
    });

    it('should return false if amounts differ', () => {
      const m1 = money.make(100, USD, true);
      const m2 = money.make(200, USD, true);
      expect(money.equals(m1, m2)).toBe(false);
    });

    it('should return false if currencies differ', () => {
      const m1 = money.make(100, USD, true);
      const m2 = money.make(100, NGN, true);
      expect(money.equals(m1, m2)).toBe(false);
    });
  });

  describe('min', () => {
    it('should return the money object with the minimum amount', () => {
      const m1 = money.make(500, USD, true);
      const m2 = money.make(150, USD, true);
      const m3 = money.make(300, USD, true);

      const result = money.min(m1, m2, m3);
      expect(result.amount).toBe(BigInt(150));
    });

    it('should throw if no arguments are provided', () => {
      expect(() => money.min()).toThrow(
        new AppError('Provide at least one parameter for minimum')
      );
    });

    it('should throw if mixed currencies are provided', () => {
      const m1 = money.make(100, NGN, true);
      const m2 = money.make(100, USD, true);
      expect(() => money.min(m1, m2)).toThrow(
        new AppError('Please provide money objects with the same currency', {
          cause: [m1, m2],
        })
      );
    });
  });

  describe('max', () => {
    it('should return the money object with the maximum amount', () => {
      const m1 = money.make(150, USD, true);
      const m2 = money.make(500, USD, true);
      const m3 = money.make(300, USD, true);

      const result = money.max(m1, m2, m3);
      expect(result.amount).toBe(BigInt(500));
    });

    it('should throw if no arguments are provided', () => {
      expect(() => money.max()).toThrow(
        new AppError('Provide at least one parameter for maximum')
      );
    });

    it('should throw if mixed currencies are provided', () => {
      const m1 = money.make(100, NGN, true);
      const m2 = money.make(100, USD, true);
      expect(() => money.max(m1, m2)).toThrow(
        new AppError('Please provide money objects with the same currency', {
          cause: [m1, m2],
        })
      );
    });
  });

  describe('isGreaterThan', () => {
    it('should return true if first is greater than second', () => {
      const m1 = money.make(500, USD, true);
      const m2 = money.make(150, USD, true);
      expect(money.isGreaterThan(m1, m2)).toBe(true);
    });

    it('should return false if first is less than or equal to second', () => {
      const m1 = money.make(150, USD, true);
      const m2 = money.make(500, USD, true);
      const m3 = money.make(150, USD, true);
      expect(money.isGreaterThan(m1, m2)).toBe(false);
      expect(money.isGreaterThan(m1, m3)).toBe(false);
    });

    it('should throw if mixed currencies are provided', () => {
      const m1 = money.make(100, NGN, true);
      const m2 = money.make(100, USD, true);
      expect(() => money.isGreaterThan(m1, m2)).toThrow(
        new AppError('Please provide money objects with the same currency', {
          cause: [m1, m2],
        })
      );
    });
  });

  describe('isLessThan', () => {
    it('should return true if first is less than second', () => {
      const m1 = money.make(150, USD, true);
      const m2 = money.make(500, USD, true);
      expect(money.isLessThan(m1, m2)).toBe(true);
    });

    it('should return false if first is greater than or equal to second', () => {
      const m1 = money.make(500, USD, true);
      const m2 = money.make(150, USD, true);
      const m3 = money.make(500, USD, true);
      expect(money.isLessThan(m1, m2)).toBe(false);
      expect(money.isLessThan(m1, m3)).toBe(false);
    });

    it('should throw if mixed currencies are provided', () => {
      const m1 = money.make(100, NGN, true);
      const m2 = money.make(100, USD, true);
      expect(() => money.isLessThan(m1, m2)).toThrow(
        new AppError('Please provide money objects with the same currency', {
          cause: [m1, m2],
        })
      );
    });
  });

  describe('sortDescending', () => {
    it('should sort money objects in descending order', () => {
      const m1 = money.make(150, USD, true);
      const m2 = money.make(500, USD, true);
      const m3 = money.make(300, USD, true);

      const result = money.sortDescending(m1, m2, m3);
      expect(result[0].amount).toBe(BigInt(500));
      expect(result[1].amount).toBe(BigInt(300));
      expect(result[2].amount).toBe(BigInt(150));
    });

    it('should throw if no arguments are provided', () => {
      expect(() => money.sortDescending()).toThrow(
        new AppError('Provide at least one parameter for sorting')
      );
    });

    it('should throw if mixed currencies are provided', () => {
      const m1 = money.make(100, NGN, true);
      const m2 = money.make(100, USD, true);
      expect(() => money.sortDescending(m1, m2)).toThrow(
        new AppError('Please provide money objects with the same currency', {
          cause: [m1, m2],
        })
      );
    });
  });

  describe('sortAscending', () => {
    it('should sort money objects in ascending order', () => {
      const m1 = money.make(500, USD, true);
      const m2 = money.make(150, USD, true);
      const m3 = money.make(300, USD, true);

      const result = money.sortAscending(m1, m2, m3);
      expect(result[0].amount).toBe(BigInt(150));
      expect(result[1].amount).toBe(BigInt(300));
      expect(result[2].amount).toBe(BigInt(500));
    });

    it('should throw if no arguments are provided', () => {
      expect(() => money.sortAscending()).toThrow(
        new AppError('Provide at least one parameter for sorting')
      );
    });

    it('should throw if mixed currencies are provided', () => {
      const m1 = money.make(100, NGN, true);
      const m2 = money.make(100, USD, true);
      expect(() => money.sortAscending(m1, m2)).toThrow(
        new AppError('Please provide money objects with the same currency', {
          cause: [m1, m2],
        })
      );
    });
  });
});
