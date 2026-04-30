import { CurrencyError } from '.';
import { getMappedErrors, TErrorCause } from '../../../shared/errors/error';

type TErrorKeyPrefix = `currency_error_currency_${string}`;

const EErrorKeys = {
  InvalidCode: 'currency_error_currency_invalid_code',
} as const satisfies Record<string, TErrorKeyPrefix>;

type USpecificCurrencyError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class SpecificCurrencyError extends CurrencyError<USpecificCurrencyError> {
  constructor(key: USpecificCurrencyError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const currencyError = Object.freeze({
  Error: SpecificCurrencyError,
  ...getMappedErrors(EErrorKeys, SpecificCurrencyError),
});

export default currencyError;
