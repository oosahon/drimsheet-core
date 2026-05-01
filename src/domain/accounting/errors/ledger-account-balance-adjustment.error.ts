import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';
import accountingError from './accounting.error';

type TErrorKeyPrefix =
  `accounting_error_ledger_account_balance_adjustment_${string}`;

const EErrorKeys = {
  MixedAccountIds:
    'accounting_error_ledger_account_balance_adjustment_mixed_account_ids',
} as const satisfies Record<string, TErrorKeyPrefix>;

type ULedgerAccountBalanceAdjustmentError =
  (typeof EErrorKeys)[keyof typeof EErrorKeys];

class LedgerAccountBalanceAdjustmentError extends accountingError.Base<ULedgerAccountBalanceAdjustmentError> {
  constructor(key: ULedgerAccountBalanceAdjustmentError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'LedgerAccountBalanceAdjustmentError';
  }
}

const ledgerAccountBalanceAdjustmentError = Object.freeze({
  Base: LedgerAccountBalanceAdjustmentError,
  ...errorUtils.getMappedErrors(
    EErrorKeys,
    LedgerAccountBalanceAdjustmentError
  ),
});

export default ledgerAccountBalanceAdjustmentError;
