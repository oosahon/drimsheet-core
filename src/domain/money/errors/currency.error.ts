import { TErrorCause, TErrorKey, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import DomainError from '@shared/values/errors/domain.error';

type TErrorPrefix = TErrorKey<'currency_error'>;

class CurrencyError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'CurrencyError';
  }
}

const EErrorKeys = {
  InvalidCode: 'currency_error_code_invalid',
} as const satisfies TErrorKeys<'currency_error'>;

const currencyError = Object.freeze({
  Base: CurrencyError,
  ...errorUtils.getMappedErrors(EErrorKeys, CurrencyError),
});

export default currencyError;
