import { IOpeningBalanceDto } from '../../../journal-entry/dtos/opening-balance/opening-balance.dto';
import ledgerAppError from '../../errors/ledger.error';

export default function validateOpeningBalanceExchangeRate(
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
