import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';
import appError from '../../../shared/values/errors/app.error';

type TErrorKeyPrefix = `app_error_accounting_${string}`;

const EErrorKeys = {
  ActiveEntityNotFound: 'app_error_accounting_active_entity_not_found',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UAccountingError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class AccountingAppError extends appError.Base<UAccountingError> {
  constructor(key: UAccountingError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'AccountingAppError';
  }
}

const accountingAppError = Object.freeze({
  Base: AccountingAppError,
  ...errorUtils.getMappedErrors(EErrorKeys, AccountingAppError),
});

export default accountingAppError;
