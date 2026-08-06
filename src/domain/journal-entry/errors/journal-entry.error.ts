import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';
import DomainError from '../../../shared/values/errors/domain.error';

type TErrorPrefix = `journal_entry_error_${string}`;

class JournalEntryError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'JournalEntryError';
  }
}

const EErrorKeys = {
  // TODO: remove the use of redundant "InvalidValue"
  InvalidValue: 'journal_entry_error_invalid_value',
  InvalidAccountingEntity: 'journal_entry_error_invalid_accounting_entity',
  InvalidStatus: 'journal_entry_error_invalid_status',
  InvalidStatusTransition: 'journal_entry_error_invalid_status_transition',
  InvalidLineItems: 'journal_entry_error_invalid_line_items',
  InvalidJournalLineItem: 'journal_entry_error_invalid_journal_line_item',
  UnbalancedJournalEntry: 'journal_entry_error_unbalanced_journal_entry',
  DuplicateSequenceOrders: 'journal_entry_error_duplicate_sequence_orders',
  InvalidSourceType: 'journal_entry_error_invalid_source_type',
  CounterpartyIdNotAllowed: 'journal_entry_error_counterparty_id_not_allowed',
  InvalidPostingDate: 'journal_entry_error_invalid_posting_date',
  InvalidEffectiveDate: 'journal_entry_error_invalid_effective_date',
  InvalidOpeningBalanceDate: 'journal_entry_error_invalid_opening_balance_date',
  InvalidVoidedAt: 'journal_entry_error_invalid_voided_at',
  InvalidCounterpartyId: 'journal_entry_error_invalid_counterparty_id',
  InvalidMemo: 'journal_entry_error_invalid_memo',
  ControlAccountOpeningBalanceNotAllowed:
    'journal_entry_error_control_account_opening_balance_not_allowed',
  ControlAccountNotAllowed: 'journal_entry_error_control_account_not_allowed',
  ExistingOpeningBalance: 'journal_entry_error_existing_opening_balance',
  UnConfiguredOpeningBalanceAccount:
    'journal_entry_error_unconfigured_opening_balance_account',
  AccountNotFound: 'journal_entry_error_account_not_found',
  EmptyJournalLines: 'journal_entry_error_empty_journal_lines',
  MismatchedJournalLines: 'journal_entry_error_mismatched_journal_lines',
  ControlAccountTransactionNotAllowed:
    'journal_entry_error_control_account_transaction_not_allowed',
  TransferNotPermittedOnAccount:
    'journal_entry_error_transfer_not_permitted_on_account',
  UnsupportedSourceType: 'journal_entry_error_unsupported_source_type',
  InvalidJournalEntry: 'journal_entry_error_invalid_journal_entry',
  EntryPredatesAccountOpeningBalance:
    'journal_entry_error_entry_predates_account_opening_balance',
  DuplicateAccountsNotPermitted:
    'journal_entry_error_entry_duplicate_accounts_not_permitted',
  InvalidSourceAccount: 'journal_entry_error_entry_invalid_source_account',
  InvalidDestinationAccount:
    'journal_entry_error_entry_invalid_destination_account',
  EffectiveDateIsBeforeOpeningDate:
    'journal_entry_error_entry_cannot_record_entry_before_account_opening_date',
} as const satisfies Record<string, TErrorPrefix>;

const journalEntryError = Object.freeze({
  Base: JournalEntryError,
  ...errorUtils.getMappedErrors(EErrorKeys, JournalEntryError),
});

export default journalEntryError;
