import { BookkeepingError } from '.';
import { getMappedErrors, TErrorCause } from '../../../shared/utils/error';

type TErrorKeyPrefix = `bookkeeping_error_ledger_account_balance_${string}`;

const EErrorKeys = {
  InvalidBalanceEffect:
    'bookkeeping_error_ledger_account_balance_invalid_balance_effect',
} as const satisfies Record<string, TErrorKeyPrefix>;

type ULedgerAccountBalanceError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class LedgerAccountBalanceError extends BookkeepingError<ULedgerAccountBalanceError> {
  constructor(key: ULedgerAccountBalanceError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const ledgerAccountBalanceError = Object.freeze({
  Error: LedgerAccountBalanceError,
  ...getMappedErrors(EErrorKeys, LedgerAccountBalanceError),
});

export default ledgerAccountBalanceError;
