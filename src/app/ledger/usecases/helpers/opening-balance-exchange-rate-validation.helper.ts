import { IOpeningBalanceDto } from '@app/journal-entry/dtos/opening-balance/opening-balance.dto';
import ledgerAppError from '@app/ledger/errors/ledger.error';

export default function openingBalanceExchangeRateValidationHelper(
  functionalCurrencyCode: string,
  currencyCode: string,
  openingBalance: IOpeningBalanceDto | null
): void {
  const isForex = functionalCurrencyCode !== currencyCode;
  const requiresExchangeRate = isForex && openingBalance;

  if (requiresExchangeRate && !openingBalance?.exchangeRate) {
    throw new ledgerAppError.ExchangeRateRequired({ openingBalance });
  }
}
