import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import moneyError from '@domain/money/errors/money.error';
import { IMoney } from '@domain/money/types/money.types';
import moneyValue from '@domain/money/values/money.vo';
import moneyValidation from '@domain/money/values/validations/money.validation';

describe('moneyValidation', () => {
  const NGN = SYSTEM_CURRENCIES.NGN;
  const USD = SYSTEM_CURRENCIES.USD;

  it('is frozen', () => {
    expect(Object.isFrozen(moneyValidation)).toBe(true);
  });

  it('is exposed through the money value object', () => {
    expect(moneyValue.isSameCurrency).toBe(moneyValidation.isSameCurrency);
    expect(moneyValue.validate).toBe(moneyValidation.validate);
    expect(moneyValue.equals).toBe(moneyValidation.equals);
    expect(moneyValue.isGreaterThan).toBe(moneyValidation.isGreaterThan);
    expect(moneyValue.isLessThan).toBe(moneyValidation.isLessThan);
    expect(moneyValue.isZeroAmount).toBe(moneyValidation.isZeroAmount);
  });

  describe('isSameCurrency', () => {
    it('returns false for empty arguments', () => {
      expect(moneyValidation.isSameCurrency()).toBe(false);
    });

    it('returns true when all currencies are identical', () => {
      const first = moneyValue.make(100, USD, true);
      const second = moneyValue.make(250, USD, true);

      expect(moneyValidation.isSameCurrency(first, second)).toBe(true);
    });

    it('returns false when currencies differ', () => {
      const first = moneyValue.make(100, USD, true);
      const second = moneyValue.make(100, NGN, true);

      expect(moneyValidation.isSameCurrency(first, second)).toBe(false);
    });
  });

  describe('validate', () => {
    it('does not throw for valid money', () => {
      const value = moneyValue.make(100, USD, true);

      expect(() => moneyValidation.validate(value)).not.toThrow();
    });

    it('throws when the amount is not a bigint', () => {
      const value = { amount: 100, currency: USD } as unknown as IMoney;

      expect(() => moneyValidation.validate(value)).toThrow(
        new moneyError.InvalidAmount({ amount: 100 })
      );
    });

    it('throws when the currency code is invalid', () => {
      const value = {
        amount: 100n,
        currency: { ...USD, code: 'FAKE' },
      } as unknown as IMoney;

      expect(() => moneyValidation.validate(value)).toThrow(
        new moneyError.InvalidCurrencyCode({ currencyCode: 'FAKE' })
      );
    });
  });

  describe('equals', () => {
    it('returns true for equal money values', () => {
      const first = moneyValue.make(100, USD, true);
      const second = moneyValue.make(100, USD, true);

      expect(moneyValidation.equals(first, second)).toBe(true);
    });

    it('returns false when amounts differ', () => {
      const first = moneyValue.make(100, USD, true);
      const second = moneyValue.make(200, USD, true);

      expect(moneyValidation.equals(first, second)).toBe(false);
    });

    it('returns false when currencies differ', () => {
      const first = moneyValue.make(100, USD, true);
      const second = moneyValue.make(100, NGN, true);

      expect(moneyValidation.equals(first, second)).toBe(false);
    });
  });

  describe('isGreaterThan', () => {
    it('compares money values in the same currency', () => {
      const greater = moneyValue.make(500, USD, true);
      const lesser = moneyValue.make(150, USD, true);
      const equal = moneyValue.make(500, USD, true);

      expect(moneyValidation.isGreaterThan(greater, lesser)).toBe(true);
      expect(moneyValidation.isGreaterThan(lesser, greater)).toBe(false);
      expect(moneyValidation.isGreaterThan(greater, equal)).toBe(false);
    });

    it('throws when currencies differ', () => {
      const first = moneyValue.make(100, NGN, true);
      const second = moneyValue.make(100, USD, true);

      expect(() => moneyValidation.isGreaterThan(first, second)).toThrow(
        new moneyError.CurrencyMismatch({ money: first, other: second })
      );
    });
  });

  describe('isLessThan', () => {
    it('compares money values in the same currency', () => {
      const lesser = moneyValue.make(150, USD, true);
      const greater = moneyValue.make(500, USD, true);
      const equal = moneyValue.make(150, USD, true);

      expect(moneyValidation.isLessThan(lesser, greater)).toBe(true);
      expect(moneyValidation.isLessThan(greater, lesser)).toBe(false);
      expect(moneyValidation.isLessThan(lesser, equal)).toBe(false);
    });

    it('throws when currencies differ', () => {
      const first = moneyValue.make(100, NGN, true);
      const second = moneyValue.make(100, USD, true);

      expect(() => moneyValidation.isLessThan(first, second)).toThrow(
        new moneyError.CurrencyMismatch({ money: first, other: second })
      );
    });
  });

  describe('isZeroAmount', () => {
    it('identifies zero and non-zero amounts', () => {
      const zero = moneyValue.makeZeroAmount(USD);
      const nonZero = moneyValue.make(100, USD, true);

      expect(moneyValidation.isZeroAmount(zero)).toBe(true);
      expect(moneyValidation.isZeroAmount(nonZero)).toBe(false);
    });
  });
});
