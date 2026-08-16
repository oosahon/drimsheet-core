import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import DomainError from '@shared/values/errors/domain.error';

const EErrorKeys = {
  InvalidValue: 'money_error_value_invalid',
  NonNormalizableAmount: 'money_error_non_normalizable_amount_invalid',
  InvalidCurrencyCode: 'money_error_currency_code_invalid',
  FractionalMinorUnit: 'money_error_fractional_minor_unit_invalid',
  MissingArguments: 'money_error_missing_arguments_invalid',
  CurrencyMismatch: 'money_error_currency_mismatch_invalid',
  InvalidFactor: 'money_error_factor_invalid',
  DivisionByZero: 'money_error_division_by_zero_invalid',
  InvalidAmount: 'money_error_amount_invalid',
} as const satisfies TErrorKeys<'money_error'>;

type UMoneyError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class MoneyError extends DomainError<UMoneyError> {
  constructor(key: UMoneyError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'MoneyError';
  }
}

const moneyError = Object.freeze({
  Base: MoneyError,
  ...errorUtils.getMappedErrors(EErrorKeys, MoneyError),
});

export default moneyError;
