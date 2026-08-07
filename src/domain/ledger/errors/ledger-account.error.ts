import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';
import DomainError from '../../../shared/values/errors/domain.error';

type TErrorKeyPrefix = `ledger_error_${string}`;

const EErrorKeys = {
  InvalidId: 'ledger_error_invalid_id',
  InvalidAction: 'ledger_error_invalid_action',
  InvalidDate: 'ledger_error_invalid_date',
  InvalidType: 'ledger_error_ledger_account_invalid_type',
  InvalidNormalBalance: 'ledger_error_ledger_account_invalid_normal_balance',
  InvalidCode: 'ledger_error_ledger_account_invalid_code',
  InvalidName: 'ledger_error_ledger_account_invalid_name',
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
  InvalidOpeningBalanceDate:
    'ledger_error_ledger_account_invalid_opening_balance_date',
  ForbiddenControlAccountOpeningBalanceDate:
    'ledger_error_ledger_account_forbidden_control_account_opening_balance_date',
  OpeningBalanceDateAlreadySet:
    'ledger_error_ledger_account_opening_balance_date_already_set',
  InvalidAccountingEntityId:
    'ledger_error_ledger_account_invalid_accounting_entity_id',
  InvalidControlAccountId:
    'ledger_error_ledger_account_invalid_control_account_id',
  InvalidCreatorId: 'ledger_error_ledger_account_invalid_creator_id',
  InvalidCountryCode: 'ledger_error_ledger_account_invalid_country_code',
  InvalidBankName: 'ledger_error_ledger_account_invalid_bank_name',
  InvalidBankAccountName:
    'ledger_error_ledger_account_invalid_bank_account_name',
  InvalidBankAccountNumber:
    'ledger_error_ledger_account_invalid_bank_account_number',
  InvalidSortCode: 'ledger_error_ledger_account_invalid_sort_code',
  InvalidSwiftCode: 'ledger_error_ledger_account_invalid_swift_code',
  InvalidIban: 'ledger_error_ledger_account_invalid_iban',
  InvalidRoutingNumber: 'ledger_error_ledger_account_invalid_routing_number',
  InvalidBranchCode: 'ledger_error_ledger_account_invalid_branch_code',
  InvalidTaxAuthority: 'ledger_error_ledger_account_invalid_tax_authority',
  InvalidTaxType: 'ledger_error_ledger_account_invalid_tax_type',
  InvalidCounterpartyId: 'ledger_error_ledger_account_invalid_counterparty_id',
  InvalidInvoiceId: 'ledger_error_ledger_account_invalid_invoice_id',
  InvalidCardIssuer: 'ledger_error_ledger_account_invalid_card_issuer',
  InvalidLastFourDigits: 'ledger_error_ledger_account_invalid_last_four_digits',
  InvalidLinkedBankAccountId:
    'ledger_error_ledger_account_invalid_linked_bank_account_id',
  InvalidLenderName: 'ledger_error_ledger_account_invalid_lender_name',
  ControlAccountNotFound:
    'ledger_error_asset_account_control_account_not_found',
  InvalidControlAccount: 'ledger_error_asset_account_invalid_control_account',
  OpeningBalanceCurrencyMismatch:
    'ledger_error_asset_account_opening_balance_currency_mismatch',
  DuplicateBankAccount: 'ledger_error_asset_account_duplicate_bank_account',
} as const satisfies Record<string, TErrorKeyPrefix>;

type ULedgerAccountError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class LedgerAccountError extends DomainError<ULedgerAccountError> {
  constructor(key: ULedgerAccountError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'LedgerAccountError';
  }
}

const ledgerAccountError = Object.freeze({
  Base: LedgerAccountError,
  ...errorUtils.getMappedErrors(EErrorKeys, LedgerAccountError),
});

export default ledgerAccountError;
