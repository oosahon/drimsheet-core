import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';

import currencyError from './currency.error';

const EErrorKeys = {
  InvalidType: 'currency_error_exchange_rate_type_invalid',
  InvalidPair: 'currency_error_exchange_rate_pair_invalid',
  NotFound: 'currency_error_exchange_rate_not_found',
  UpdateNotPermitted:
    'currency_error_exchange_rate_update_not_permitted_conflict',
  InvalidDate: 'currency_error_exchange_rate_date_invalid',
  InvalidRate: 'currency_error_exchange_rate_rate_invalid',
  InvalidSource: 'currency_error_exchange_rate_source_invalid',
} as const satisfies TErrorKeys<'currency_error_exchange_rate'>;

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
