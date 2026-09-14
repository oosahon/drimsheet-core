import {
  EExchangeRateType,
  UExchangeRateType,
} from '@domain/money/types/exchange-rate.types';
import exchangeRateValue from '@domain/money/values/exchange-rate.vo';
import exchangeRateValidation from '@domain/money/values/validations/exchange-rate.validation';

describe('exchangeRateValidation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-15T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('is frozen', () => {
    expect(Object.isFrozen(exchangeRateValidation)).toBe(true);
  });

  it('is exposed through the exchange-rate value object', () => {
    expect(exchangeRateValue.validate).toBe(exchangeRateValidation.validate);
    expect(exchangeRateValue.validateType).toBe(
      exchangeRateValidation.validateType
    );
    expect(exchangeRateValue.validateCurrencyPair).toBe(
      exchangeRateValidation.validateCurrencyPair
    );
  });

  describe('validateType', () => {
    it('does not throw for valid types', () => {
      expect(() =>
        exchangeRateValidation.validateType(EExchangeRateType.Official)
      ).not.toThrow();
      expect(() =>
        exchangeRateValidation.validateType(EExchangeRateType.Negotiated)
      ).not.toThrow();
    });

    it('throws for an invalid type', () => {
      expect(() =>
        exchangeRateValidation.validateType('invalid' as UExchangeRateType)
      ).toThrow();
    });
  });

  describe('validateCurrencyPair', () => {
    it('does not throw for a valid currency pair', () => {
      expect(() =>
        exchangeRateValidation.validateCurrencyPair({
          currencyPair: 'EUR/USD',
          baseCurrencyCode: 'EUR',
          targetCurrencyCode: 'USD',
        })
      ).not.toThrow();
    });

    it('throws if length is not exactly 7', () => {
      expect(() =>
        exchangeRateValidation.validateCurrencyPair({
          currencyPair: 'EURUSD',
          baseCurrencyCode: 'EUR',
          targetCurrencyCode: 'USD',
        })
      ).toThrow();

      expect(() =>
        exchangeRateValidation.validateCurrencyPair({
          currencyPair: 'EURO/USD',
          baseCurrencyCode: 'EURO',
          targetCurrencyCode: 'USD',
        })
      ).toThrow();
    });

    it('throws if base does not match currency pair', () => {
      expect(() =>
        exchangeRateValidation.validateCurrencyPair({
          currencyPair: 'EUR/USD',
          baseCurrencyCode: 'GBP',
          targetCurrencyCode: 'USD',
        })
      ).toThrow();
    });

    it('throws if target does not match currency pair', () => {
      expect(() =>
        exchangeRateValidation.validateCurrencyPair({
          currencyPair: 'EUR/USD',
          baseCurrencyCode: 'EUR',
          targetCurrencyCode: 'GBP',
        })
      ).toThrow();
    });
  });

  describe('validate', () => {
    const validExchangeRate = {
      currencyPair: 'EUR/USD',
      baseCurrencyCode: 'EUR',
      targetCurrencyCode: 'USD',
      rate: 1.1,
      type: EExchangeRateType.Official,
      asOf: new Date('2026-04-14T00:00:00.000Z'),
      source: 'ECB',
      createdAt: new Date('2026-04-15T00:00:00.000Z'),
    };

    it('does not throw for a valid exchange rate', () => {
      expect(() =>
        exchangeRateValidation.validate(validExchangeRate)
      ).not.toThrow();
    });

    it('throws if currency pair is invalid', () => {
      expect(() =>
        exchangeRateValidation.validate({
          ...validExchangeRate,
          currencyPair: 'EUR-USD',
        })
      ).toThrow();
    });

    it('throws if rate is not positive', () => {
      expect(() =>
        exchangeRateValidation.validate({
          ...validExchangeRate,
          rate: -1.1,
        })
      ).toThrow();

      expect(() =>
        exchangeRateValidation.validate({
          ...validExchangeRate,
          rate: 0,
        })
      ).toThrow();
    });

    it('throws if asOf is in the future', () => {
      expect(() =>
        exchangeRateValidation.validate({
          ...validExchangeRate,
          asOf: new Date('2026-04-16T00:00:00.000Z'),
        })
      ).toThrow();
    });

    it('throws if source length is out of range', () => {
      expect(() =>
        exchangeRateValidation.validate({
          ...validExchangeRate,
          source: 'ab',
        })
      ).toThrow();

      expect(() =>
        exchangeRateValidation.validate({
          ...validExchangeRate,
          source: 'a'.repeat(101),
        })
      ).toThrow();
    });

    it('throws if type is invalid', () => {
      expect(() =>
        exchangeRateValidation.validate({
          ...validExchangeRate,
          type: 'invalid' as UExchangeRateType,
        })
      ).toThrow();
    });

    it('throws if createdAt is invalid', () => {
      expect(() =>
        exchangeRateValidation.validate({
          ...validExchangeRate,
          createdAt: new Date('invalid'),
        })
      ).toThrow();
    });
  });
});
