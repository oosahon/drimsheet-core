import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';
import bookkeepingError from './bookkeeping.error';

type TErrorKeyPrefix = `bookkeeping_error_ledger_account_balance_${string}`;

const EErrorKeys = {
  InvalidBalanceEffect:
    'bookkeeping_error_ledger_account_balance_invalid_balance_effect',
} as const satisfies Record<string, TErrorKeyPrefix>;

type ULedgerAccountBalanceError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class LedgerAccountBalanceError extends bookkeepingError.Base<ULedgerAccountBalanceError> {
  constructor(key: ULedgerAccountBalanceError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const ledgerAccountBalanceError = Object.freeze({
  Base: LedgerAccountBalanceError,
  ...errorUtils.getMappedErrors(EErrorKeys, LedgerAccountBalanceError),
});

export default ledgerAccountBalanceError;
