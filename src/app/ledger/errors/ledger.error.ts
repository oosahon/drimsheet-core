import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';
import appError from '../../../shared/values/errors/app.error';

type TErrorKeyPrefix = `app_error_ledger_${string}`;

const EErrorKeys = {
  AccountNotFound: 'app_error_ledger_account_not_found',
  BalanceNotFound: 'app_error_ledger_balance_not_found',
  InvalidSubtype: 'app_error_ledger_invalid_sub_type',
  ExchangeRateRequired: 'app_error_ledger_exchange_rate_required',
  InconsistentBootstrap: 'app_error_ledger_inconsistent_bootstrap',
} as const satisfies Record<string, TErrorKeyPrefix>;

type ULedgerError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class LedgerAppError extends appError.Base<ULedgerError> {
  constructor(key: ULedgerError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'LedgerAppError';
  }
}

const ledgerAppError = Object.freeze({
  Base: LedgerAppError,
  ...errorUtils.getMappedErrors(EErrorKeys, LedgerAppError),
});

export default ledgerAppError;
