import ledgerAppError from '@app/ledger/errors/ledger.error';
import validateOpeningBalanceExchangeRate from '@app/ledger/usecases/helpers/opening-balance-exchange-rate-validation.helper';

describe('validateOpeningBalanceExchangeRate', () => {
  it('does not throw when currency matches functional currency', () => {
    expect(() =>
      validateOpeningBalanceExchangeRate('NGN', 'NGN', null)
    ).not.toThrow();
  });

  it('throws ExchangeRateRequired when forex account has opening balance without exchange rate', () => {
    expect(() =>
      validateOpeningBalanceExchangeRate('NGN', 'USD', {
        amount: { amount: 1000, currencyCode: 'USD', isMinorUnit: true },
        exchangeRate: null,
        date: new Date(),
      })
    ).toThrow(ledgerAppError.ExchangeRateRequired);
  });
});
