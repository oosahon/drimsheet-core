import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';
import DomainError from '../../../shared/values/errors/domain.error';

type TErrorKeyPrefix = `ledger_balance_error_${string}`;

const EErrorKeys = {
  InvalidBalanceEffect: 'ledger_balance_error_invalid_balance_effect',
  InvalidLedgerAccountId: 'ledger_balance_error_invalid_ledger_account_id',
  InvalidAccountingEntityId:
    'ledger_balance_error_invalid_accounting_entity_id',
  InvalidJournalEntryId: 'ledger_balance_error_invalid_journal_entry_id',
  InvalidCreatorId: 'ledger_balance_error_invalid_creator_id',
} as const satisfies Record<string, TErrorKeyPrefix>;

type ULedgerAccountBalanceError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class LedgerAccountBalanceError extends DomainError<ULedgerAccountBalanceError> {
  constructor(key: ULedgerAccountBalanceError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'LedgerAccountBalanceError';
  }
}

const ledgerAccountBalanceError = Object.freeze({
  Base: LedgerAccountBalanceError,
  ...errorUtils.getMappedErrors(EErrorKeys, LedgerAccountBalanceError),
});

export default ledgerAccountBalanceError;
