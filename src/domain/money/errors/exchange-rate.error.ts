import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';
import currencyError from './currency.error';

type TErrorKeyPrefix = `currency_error_exchange_rate_${string}`;

const EErrorKeys = {
  InvalidType: 'currency_error_exchange_rate_invalid_type',
  InvalidPair: 'currency_error_exchange_rate_invalid_pair',
  NotFound: 'currency_error_exchange_rate_not_found',
  UpdateNotPermitted: 'currency_error_exchange_rate_update_not_permitted',
  InvalidDate: 'currency_error_exchange_rate_invalid_date',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UExchangeRateError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class ExchangeRateError extends currencyError.Base<UExchangeRateError> {
  constructor(key: UExchangeRateError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'ExchangeRateError';
  }
}

const exchangeRateError = Object.freeze({
  Base: ExchangeRateError,
  ...errorUtils.getMappedErrors(EErrorKeys, ExchangeRateError),
});

export default exchangeRateError;
