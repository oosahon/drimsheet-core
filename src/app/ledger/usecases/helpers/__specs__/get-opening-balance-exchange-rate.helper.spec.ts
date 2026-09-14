import getOpeningBalanceExchangeRate from '@app/ledger/usecases/helpers/opening-balance-exchange-rate-getter.helper';

describe('getOpeningBalanceExchangeRate', () => {
  it('returns null when opening balance is null or exchangeRate is null', () => {
    expect(getOpeningBalanceExchangeRate(null)).toBeNull();
    expect(
      getOpeningBalanceExchangeRate({
        amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
        exchangeRate: null,
        date: new Date(),
      })
    ).toBeNull();
  });

  it('returns valid exchange rate object when exchangeRate is provided', () => {
    const result = getOpeningBalanceExchangeRate({
      amount: { amount: 1000, currencyCode: 'USD', isMinorUnit: true },
      exchangeRate: {
        baseCurrencyCode: 'USD',
        targetCurrencyCode: 'NGN',
        rate: 1500,
        type: 'market' as any,
        source: 'manual',
        asOf: new Date('2026-04-01T00:00:00.000Z'),
      },
      date: new Date('2026-04-01T00:00:00.000Z'),
    });

    expect(result).not.toBeNull();
    expect(result?.baseCurrencyCode).toBe('USD');
    expect(result?.targetCurrencyCode).toBe('NGN');
    expect(result?.rate).toBe(1500);
  });
});
