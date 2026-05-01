import {
  DomainError,
  getMappedErrors,
  TErrorCause,
} from '../../../shared/utils/error';

type TErrorPrefix = `currency_error_${string}`;

export class CurrencyError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
  }
}

const EErrorKeys = {
  InvalidCode: 'currency_error_invalid_code',
} as const satisfies Record<string, TErrorPrefix>;

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
