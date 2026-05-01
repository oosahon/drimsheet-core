import DomainError from '../../../shared/errors/domain.error';
import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';

type TErrorPrefix = `subledger_error_${string}`;

const EErrorKeys = {
  InvalidValue: 'subledger_error_invalid_value',
} as const satisfies Record<string, TErrorPrefix>;

type USubledgerError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class SubledgerError<
  K extends TErrorPrefix = USubledgerError,
> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
  }
}

const subledgerError = Object.freeze({
  Base: SubledgerError,
  ...errorUtils.getMappedErrors(EErrorKeys, SubledgerError),
});

export default subledgerError;
