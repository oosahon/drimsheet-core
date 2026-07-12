import { EExchangeRateType } from '../../../../../domain/currency/types/exchange-rate.types';
import exchangeRateMapper, {
  IExchangeRateModel,
} from '../exchange-rate.mapper';

describe('Exchange Rate Mapper', () => {
  const asOf = new Date('2026-05-01T00:00:00.000Z');
  const createdAt = new Date('2026-05-01T10:30:00.000Z');

  describe('toRepo', () => {
    it('maps an exchange rate to a repo model', () => {
      expect(
        exchangeRateMapper.toRepo({
          currencyPair: 'USDNGN',
          baseCurrencyCode: 'USD',
          targetCurrencyCode: 'NGN',
          rate: 1500.25,
          type: EExchangeRateType.Official,
          asOf,
          source: 'Central Bank',
          createdAt,
        })
      ).toEqual({
        currencyPair: 'USDNGN',
        baseCurrencyCode: 'USD',
        targetCurrencyCode: 'NGN',
        rate: '1500.25',
        type: EExchangeRateType.Official,
        asOf: asOf.toISOString(),
        source: 'Central Bank',
        createdAt: createdAt.toISOString(),
      });
    });
  });

  describe('toDomain', () => {
    it('maps an exchange rate repo model to the domain shape', () => {
      const model: IExchangeRateModel = {
        id: 1n,
        currencyPair: 'USDNGN',
        baseCurrencyCode: 'USD',
        targetCurrencyCode: 'NGN',
        rate: '1500.25',
        type: EExchangeRateType.Negotiated,
        asOf: asOf.toISOString(),
        source: 'Desk',
        createdAt: createdAt.toISOString(),
      };

      expect(exchangeRateMapper.toDomain(model)).toEqual({
        currencyPair: 'USDNGN',
        baseCurrencyCode: 'USD',
        targetCurrencyCode: 'NGN',
        rate: 1500.25,
        type: EExchangeRateType.Negotiated,
        asOf,
        source: 'Desk',
        createdAt,
      });
    });
  });
});
