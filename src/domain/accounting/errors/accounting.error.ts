import DomainError from '../../../shared/errors/domain.error';
import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';

type TErrorPrefix = `accounting_error_${string}`;

const EErrorKeys = {
  InvalidValue: 'accounting_error_invalid_value',
} as const satisfies Record<string, TErrorPrefix>;

type UAccountingError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class AccountingError<
  K extends TErrorPrefix = UAccountingError,
> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'AccountingError';
  }
}

const accountingError = Object.freeze({
  Base: AccountingError,
  ...errorUtils.getMappedErrors(EErrorKeys, AccountingError),
});

export default accountingError;
