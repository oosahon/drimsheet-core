import { TErrorCause } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import DomainError from '@shared/values/errors/domain.error';

type TErrorPrefix = `accounting_error_${string}`;

const EErrorKeys = {
  InvalidValue: 'accounting_error_invalid_value',
  InvalidAction: 'accounting_error_invalid_action',
  InvalidId: 'accounting_error_invalid_id',
  InvalidDate: 'accounting_error_invalid_date',
  InvalidJurisdictionCode: 'accounting_error_invalid_jurisdiction_code',
  InvalidAccountingEntityType:
    'accounting_error_invalid_accounting_entity_type',
  InvalidAccountingStandardCode:
    'accounting_error_invalid_accounting_standard_code',
  TransferNotPermittedOnAccount:
    'accounting_error_transfer_not_permitted_on_account',
  PaymentNotPermittedOnAccount:
    'accounting_error_payment_not_permitted_on_account',
} as const satisfies Record<string, TErrorPrefix>;

type UAccountingError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class AccountingError<
  K extends TErrorPrefix = UAccountingError,
> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'AccountingError';
  }
}

const accountingError = Object.freeze({
  Base: AccountingError,
  ...errorUtils.getMappedErrors(EErrorKeys, AccountingError),
});

export default accountingError;
