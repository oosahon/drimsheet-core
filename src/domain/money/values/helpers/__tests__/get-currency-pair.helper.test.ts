import currencyError from '@domain/money/errors/currency.error';
import getExchangeRateCurrencyPair from '@domain/money/values/helpers/get-currency-pair.helper';

describe('getExchangeRateCurrencyPair', () => {
  it('returns the currency pair', () => {
    expect(getExchangeRateCurrencyPair('EUR', 'USD')).toBe('EUR/USD');
  });

  it.each([
    ['INVALID', 'USD'],
    ['EUR', 'INVALID'],
  ])(
    'throws InvalidCode for invalid currency pair %s/%s',
    (baseCode, targetCode) => {
      expect(() => getExchangeRateCurrencyPair(baseCode, targetCode)).toThrow(
        currencyError.InvalidCode
      );
    }
  );
});
