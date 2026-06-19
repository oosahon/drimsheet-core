import DomainError from '../../../shared/errors/domain.error';
import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';

type TErrorPrefix = `accounting_error_${string}`;

const EErrorKeys = {
  InvalidValue: 'accounting_error_invalid_value',
  InvalidAction: 'accounting_error_invalid_action',
  InvalidId: 'accounting_error_invalid_id',
  InvalidDate: 'accounting_error_invalid_date',
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
