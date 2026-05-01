import DomainError from '../../../shared/errors/domain.error';
import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';

type TErrorPrefix = `currency_error_${string}`;

class CurrencyError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
  }
}

const EErrorKeys = {
  InvalidValue: 'currency_error_invalid_value',
  InvalidCode: 'currency_error_invalid_code',
} as const satisfies Record<string, TErrorPrefix>;

const currencyError = Object.freeze({
  Base: CurrencyError,
  ...errorUtils.getMappedErrors(EErrorKeys, CurrencyError),
});

export default currencyError;
