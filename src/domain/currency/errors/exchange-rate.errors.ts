import { CurrencyError } from '.';
import { getMappedErrors, TErrorCause } from '../../../shared/errors/error';

type TErrorKeyPrefix = `currency_error_exchange_rate_${string}`;

const EErrorKeys = {
  InvalidType: 'currency_error_exchange_rate_invalid_type',
  InvalidPair: 'currency_error_exchange_rate_invalid_pair',
  NotFound: 'currency_error_exchange_rate_not_found',
  UpdateNotPermitted: 'currency_error_exchange_rate_update_not_permitted',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UExchangeRateError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class ExchangeRateError extends CurrencyError<UExchangeRateError> {
  constructor(key: UExchangeRateError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const exchangeRateError = Object.freeze({
  Error: ExchangeRateError,
  ...getMappedErrors(EErrorKeys, ExchangeRateError),
});

export default exchangeRateError;
