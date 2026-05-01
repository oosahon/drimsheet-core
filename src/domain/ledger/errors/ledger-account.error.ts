import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';
import LedgerError from './ledger.error';

type TErrorKeyPrefix = `ledger_error_ledger_account_${string}`;

const EErrorKeys = {
  InvalidType: 'ledger_error_ledger_account_invalid_type',
  InvalidNormalBalance: 'ledger_error_ledger_account_invalid_normal_balance',
  InvalidCode: 'ledger_error_ledger_account_invalid_code',
  InvalidStatus: 'ledger_error_ledger_account_invalid_status',
  InvalidContraRule: 'ledger_error_ledger_account_invalid_contra_rule',
  InvalidAdjunctRule: 'ledger_error_ledger_account_invalid_adjunct_rule',
  InvalidSubType: 'ledger_error_ledger_account_invalid_sub_type',
  InvalidBehavior: 'ledger_error_ledger_account_invalid_behavior',
  InvalidControlAccountStatus:
    'ledger_error_ledger_account_invalid_control_account_status',
  InvalidMeta: 'ledger_error_ledger_account_invalid_meta',
  InvalidHeaderCode: 'ledger_error_ledger_account_invalid_header_code',
  InvalidPredecessorCode:
    'ledger_error_ledger_account_invalid_predecessor_code',
  MaximumLimitReached: 'ledger_error_ledger_account_maximum_limit_reached',
  InvalidMaterializedPath:
    'ledger_error_ledger_account_invalid_materialized_path',
  InvalidParentMaterializedPath:
    'ledger_error_ledger_account_invalid_parent_materialized_path',
} as const satisfies Record<string, TErrorKeyPrefix>;

type ULedgerAccountError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class LedgerAccountError extends LedgerError<ULedgerAccountError> {
  constructor(key: ULedgerAccountError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const ledgerAccountError = Object.freeze({
  Base: LedgerAccountError,
  ...errorUtils.getMappedErrors(EErrorKeys, LedgerAccountError),
});

export default ledgerAccountError;
