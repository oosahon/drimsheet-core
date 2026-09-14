import exchangeRateError from '@domain/money/errors/exchange-rate.error';
import {
  EExchangeRateType,
  UExchangeRateType,
} from '@domain/money/types/exchange-rate.types';
import exchangeRateValue from '@domain/money/values/exchange-rate.vo';

describe('ExchangeRate Value Object', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-15T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('make', () => {
    it('should successfully create a valid exchange rate', () => {
      const payload = {
        baseCurrencyCode: 'EUR',
        targetCurrencyCode: 'USD',
        rate: 1.1,
        type: EExchangeRateType.Official,
        asOf: new Date('2026-04-14T00:00:00.000Z'),
        source: '  European Central Bank  ',
      };

      const exchangeRate = exchangeRateValue.make(payload);

      expect(exchangeRate.currencyPair).toBe('EUR/USD');
      expect(exchangeRate.baseCurrencyCode).toBe('EUR');
      expect(exchangeRate.targetCurrencyCode).toBe('USD');
      expect(exchangeRate.rate).toBe(1.1);
      expect(exchangeRate.type).toBe(EExchangeRateType.Official);
      expect(exchangeRate.asOf).toEqual(payload.asOf);
      expect(exchangeRate.source).toBe('European Central Bank');
      expect(exchangeRate.createdAt).toEqual(
        new Date('2026-04-15T00:00:00.000Z')
      );
      expect(Object.isFrozen(exchangeRate)).toBe(true);
    });

    it('should throw if type is invalid', () => {
      const payload = {
        baseCurrencyCode: 'EUR',
        targetCurrencyCode: 'USD',
        rate: 1.1,
        type: 'invalid' as UExchangeRateType,
        asOf: new Date('2026-04-14T00:00:00.000Z'),
        source: 'ECB',
      };

      expect(() => exchangeRateValue.make(payload)).toThrow();
    });

    it('should throw InvalidSource if source is invalid', () => {
      const payload = {
        baseCurrencyCode: 'EUR',
        targetCurrencyCode: 'USD',
        rate: 1.1,
        type: EExchangeRateType.Official,
        asOf: new Date('2026-04-14T00:00:00.000Z'),
        source: '',
      };

      expect(() => exchangeRateValue.make(payload)).toThrow(
        exchangeRateError.InvalidSource
      );
    });

    it('should throw if date is in the future', () => {
      const payload = {
        baseCurrencyCode: 'EUR',
        targetCurrencyCode: 'USD',
        rate: 1.1,
        type: EExchangeRateType.Official,
        asOf: new Date('2026-04-16T00:00:00.000Z'), // Future date
        source: 'ECB',
      };

      expect(() => exchangeRateValue.make(payload)).toThrow(
        exchangeRateError.InvalidDate
      );
    });
  });
});
