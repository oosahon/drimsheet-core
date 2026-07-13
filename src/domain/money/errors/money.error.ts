import DomainError from '../../../shared/errors/domain.error';
import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';

type TErrorKeyPrefix = `money_error_${string}`;

const EErrorKeys = {
  InvalidValue: 'money_error_invalid_value',
  NonNormalizableAmount: 'money_error_non_normalizable_amount',
  InvalidCurrencyCode: 'money_error_invalid_currency_code',
  FractionalMinorUnit: 'money_error_fractional_minor_unit',
  MissingArguments: 'money_error_missing_arguments',
  CurrencyMismatch: 'money_error_currency_mismatch',
  InvalidFactor: 'money_error_invalid_factor',
  DivisionByZero: 'money_error_division_by_zero',
  InvalidAmount: 'money_error_invalid_amount',
} as const satisfies Record<string, TErrorKeyPrefix>;

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
