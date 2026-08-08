import {
  currencyPairValidation,
  exchangeRateDtoValidation,
  exchangeRateQueryParamValidation,
} from '@app/money/dtos/exchange-rate/exchange-rate.dto.validation';

describe('Exchange Rate DTO Validation', () => {
  describe('currencyPairValidation', () => {
    it('should validate valid currency pairs', () => {
      expect(currencyPairValidation.safeParse('USD/EUR').success).toBe(true);
      expect(currencyPairValidation.safeParse('EUR/USD').success).toBe(true);
      expect(currencyPairValidation.safeParse('GBP/JPY').success).toBe(true);
    });

    it('should fail on invalid currency pair formats', () => {
      // Wrong length/casing/symbols
      expect(currencyPairValidation.safeParse('US/EU').success).toBe(false);
      expect(currencyPairValidation.safeParse('USDT/USD').success).toBe(false);
      expect(currencyPairValidation.safeParse('usd/eur').success).toBe(false);
      expect(currencyPairValidation.safeParse('USD-EUR').success).toBe(false);
      expect(currencyPairValidation.safeParse('USDEUR').success).toBe(false);
      expect(currencyPairValidation.safeParse('USD/').success).toBe(false);
      expect(currencyPairValidation.safeParse('/USD').success).toBe(false);
    });
  });

  describe('exchangeRateDtoValidation', () => {
    it('should validate a correct exchange rate DTO payload', () => {
      const payload = {
        baseCurrencyCode: 'EUR',
        targetCurrencyCode: 'USD',
        rate: 1.0825,
        type: 'market',
        asOf: '2026-07-13T18:00:00Z',
        source: 'OpenExchangeRates',
      };

      const result = exchangeRateDtoValidation.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.asOf).toBeInstanceOf(Date);
        expect(result.data.asOf.toISOString()).toBe('2026-07-13T18:00:00.000Z');
      }
    });

    it('should fail validation if rate is negative or zero', () => {
      const payload = {
        baseCurrencyCode: 'EUR',
        targetCurrencyCode: 'USD',
        rate: -0.5,
        type: 'market',
        asOf: '2026-07-13T18:00:00Z',
        source: 'OpenExchangeRates',
      };

      const result = exchangeRateDtoValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail validation if source is too short', () => {
      const payload = {
        baseCurrencyCode: 'EUR',
        targetCurrencyCode: 'USD',
        rate: 1.0825,
        type: 'market',
        asOf: '2026-07-13T18:00:00Z',
        source: 'A',
      };

      const result = exchangeRateDtoValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail validation if source is too long', () => {
      const payload = {
        baseCurrencyCode: 'EUR',
        targetCurrencyCode: 'USD',
        rate: 1.0825,
        type: 'market',
        asOf: '2026-07-13T18:00:00Z',
        source: 'A'.repeat(101),
      };

      const result = exchangeRateDtoValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail validation if asOf has invalid date format', () => {
      const payload = {
        baseCurrencyCode: 'EUR',
        targetCurrencyCode: 'USD',
        rate: 1.0825,
        type: 'market',
        asOf: 'invalid-date',
        source: 'OpenExchangeRates',
      };

      const result = exchangeRateDtoValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('exchangeRateQueryParamValidation', () => {
    it('should validate a correct query param payload with only currencyPair', () => {
      const payload = {
        currencyPair: 'USD/EUR',
      };
      const result = exchangeRateQueryParamValidation.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should validate a correct query param payload with all optional fields', () => {
      const payload = {
        currencyPair: 'EUR/USD',
        type: 'market',
        asOf: '2026-07-13T18:00:00Z',
        limit: 100,
        page: 1,
        orderBy: 'asOf',
      };
      const result = exchangeRateQueryParamValidation.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.asOf).toBeInstanceOf(Date);
        expect(result.data.asOf?.toISOString()).toBe(
          '2026-07-13T18:00:00.000Z'
        );
      }
    });

    it('should fail validation if currencyPair is missing', () => {
      const payload = {
        type: 'market',
      };
      const result = exchangeRateQueryParamValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail validation if currencyPair is invalid', () => {
      const payload = {
        currencyPair: 'INVALID',
      };
      const result = exchangeRateQueryParamValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail validation if type is invalid', () => {
      const payload = {
        currencyPair: 'USD/EUR',
        type: 'invalid-type',
      };
      const result = exchangeRateQueryParamValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail validation if limit is less than 1', () => {
      const payload = {
        currencyPair: 'USD/EUR',
        limit: 0,
      };
      const result = exchangeRateQueryParamValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail validation if limit is more than 200', () => {
      const payload = {
        currencyPair: 'USD/EUR',
        limit: 201,
      };
      const result = exchangeRateQueryParamValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail validation if page is less than 1', () => {
      const payload = {
        currencyPair: 'USD/EUR',
        page: 0,
      };
      const result = exchangeRateQueryParamValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail validation if asOf has invalid date format', () => {
      const payload = {
        currencyPair: 'USD/EUR',
        asOf: 'invalid-date',
      };
      const result = exchangeRateQueryParamValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
