import { getMappedErrors, TErrorCause } from '../../../shared/utils/error';
import { AccountingError } from './accounting.error';

type TErrorKeyPrefix =
  `accounting_error_ledger_account_balance_adjustment_${string}`;

const EErrorKeys = {
  MixedAccountIds:
    'accounting_error_ledger_account_balance_adjustment_mixed_account_ids',
} as const satisfies Record<string, TErrorKeyPrefix>;

type ULedgerAccountBalanceAdjustmentError =
  (typeof EErrorKeys)[keyof typeof EErrorKeys];

class LedgerAccountBalanceAdjustmentError extends AccountingError<ULedgerAccountBalanceAdjustmentError> {
  constructor(key: ULedgerAccountBalanceAdjustmentError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const ledgerAccountBalanceAdjustmentError = Object.freeze({
  Error: LedgerAccountBalanceAdjustmentError,
  ...getMappedErrors(EErrorKeys, LedgerAccountBalanceAdjustmentError),
});

export default ledgerAccountBalanceAdjustmentError;
