import LedgerError from '../../domain/ledger/errors/ledger.error';
import { TErrorCause } from '../../shared/types/error.types';
import errorUtils from '../../shared/utils/error';

type TErrorKeyPrefix = `ledger_error_${string}`;

const EErrorKeys = {
  AccountNotFound: 'ledger_error_account_not_found',
  BalanceNotFound: 'ledger_error_balance_not_found',
} as const satisfies Record<string, TErrorKeyPrefix>;

type ULedgerError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class LedgerAppError extends LedgerError<ULedgerError> {
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
