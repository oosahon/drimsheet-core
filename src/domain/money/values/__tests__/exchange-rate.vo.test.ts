import {
  EExchangeRateType,
  UExchangeRateType,
} from '../../types/exchange-rate.types';
import exchangeRateValue from '../exchange-rate.vo';

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

    it('should throw if date is in the future', () => {
      const payload = {
        baseCurrencyCode: 'EUR',
        targetCurrencyCode: 'USD',
        rate: 1.1,
        type: EExchangeRateType.Official,
        asOf: new Date('2026-04-16T00:00:00.000Z'), // Future date
        source: 'ECB',
      };

      expect(() => exchangeRateValue.make(payload)).toThrow();
    });
  });

  describe('Helpers', () => {
    describe('validateType', () => {
      it('should not throw for valid types', () => {
        expect(() =>
          exchangeRateValue.validateType(EExchangeRateType.Official)
        ).not.toThrow();
        expect(() =>
          exchangeRateValue.validateType(EExchangeRateType.Negotiated)
        ).not.toThrow();
      });

      it('should throw an AppError for an invalid type', () => {
        expect(() =>
          exchangeRateValue.validateType('invalid' as UExchangeRateType)
        ).toThrow();
      });
    });

    describe('validateCurrencyPair', () => {
      it('should not throw for a valid currency pair', () => {
        expect(() =>
          exchangeRateValue.validateCurrencyPair({
            currencyPair: 'EUR/USD',
            baseCurrencyCode: 'EUR',
            targetCurrencyCode: 'USD',
          })
        ).not.toThrow();
      });

      it('should throw if length is not exactly 7', () => {
        expect(() =>
          exchangeRateValue.validateCurrencyPair({
            currencyPair: 'EURUSD',
            baseCurrencyCode: 'EUR',
            targetCurrencyCode: 'USD',
          })
        ).toThrow();

        expect(() =>
          exchangeRateValue.validateCurrencyPair({
            currencyPair: 'EURO/USD',
            baseCurrencyCode: 'EURO',
            targetCurrencyCode: 'USD',
          })
        ).toThrow();
      });

      it('should throw if base does not match currency pair', () => {
        expect(() =>
          exchangeRateValue.validateCurrencyPair({
            currencyPair: 'EUR/USD',
            baseCurrencyCode: 'GBP',
            targetCurrencyCode: 'USD',
          })
        ).toThrow();
      });

      it('should throw if target does not match currency pair', () => {
        expect(() =>
          exchangeRateValue.validateCurrencyPair({
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

      it('should not throw for a valid exchange rate', () => {
        expect(() =>
          exchangeRateValue.validate(validExchangeRate)
        ).not.toThrow();
      });

      it('should throw if currency pair is invalid', () => {
        expect(() =>
          exchangeRateValue.validate({
            ...validExchangeRate,
            currencyPair: 'EUR-USD',
          })
        ).toThrow();
      });

      it('should throw if rate is not positive', () => {
        expect(() =>
          exchangeRateValue.validate({
            ...validExchangeRate,
            rate: -1.1,
          })
        ).toThrow();

        expect(() =>
          exchangeRateValue.validate({
            ...validExchangeRate,
            rate: 0,
          })
        ).toThrow();
      });

      it('should throw if asOf is in the future', () => {
        expect(() =>
          exchangeRateValue.validate({
            ...validExchangeRate,
            asOf: new Date('2026-04-16T00:00:00.000Z'),
          })
        ).toThrow();
      });

      it('should throw if source length is out of range', () => {
        expect(() =>
          exchangeRateValue.validate({
            ...validExchangeRate,
            source: 'ab', // min 3
          })
        ).toThrow();

        expect(() =>
          exchangeRateValue.validate({
            ...validExchangeRate,
            source: 'a'.repeat(101), // max 100
          })
        ).toThrow();
      });

      it('should throw if type is invalid', () => {
        expect(() =>
          exchangeRateValue.validate({
            ...validExchangeRate,
            type: 'invalid' as UExchangeRateType,
          })
        ).toThrow();
      });

      it('should throw if createdAt is invalid', () => {
        expect(() =>
          exchangeRateValue.validate({
            ...validExchangeRate,
            createdAt: new Date('invalid'),
          })
        ).toThrow();
      });
    });
  });
});
