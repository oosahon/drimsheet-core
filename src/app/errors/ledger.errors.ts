import AppError from '../../shared/errors/app.error';
import { TErrorCause } from '../../shared/types/error.types';
import errorUtils from '../../shared/utils/error';

type TErrorKeyPrefix = `app_error_ledger_account_${string}`;

const EErrorKeys = {
  NotFound: 'app_error_ledger_account_not_found',
  BalanceNotFound: 'app_error_ledger_account_balance_not_found',
} as const satisfies Record<string, TErrorKeyPrefix>;

type ULedgerError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class LedgerAppError extends AppError<ULedgerError> {
  constructor(key: ULedgerError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'LedgerAppError';
  }
}

const ledgerAppError = Object.freeze({
  Error: LedgerAppError,
  ...errorUtils.getMappedErrors(EErrorKeys, LedgerAppError),
});

export default ledgerAppError;
