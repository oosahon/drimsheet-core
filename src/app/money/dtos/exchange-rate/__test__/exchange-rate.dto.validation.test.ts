import { exchangeRateDtoValidation } from '../exchange-rate.dto.validation';

describe('Exchange Rate DTO Validation', () => {
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
});
