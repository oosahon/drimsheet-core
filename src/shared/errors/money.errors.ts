import { getMappedErrors, TErrorCause } from '../utils/error';
import { ValueError } from './value.errors';

type TErrorKeyPrefix = `value_error_money_${string}`;

const EErrorKeys = {
  NonNormalizableAmount: 'value_error_money_non_normalizable_amount',
  InvalidCurrencyCode: 'value_error_money_invalid_currency_code',
  FractionalMinorUnit: 'value_error_money_fractional_minor_unit',
  MissingArguments: 'value_error_money_missing_arguments',
  CurrencyMismatch: 'value_error_money_currency_mismatch',
  InvalidFactor: 'value_error_money_invalid_factor',
  DivisionByZero: 'value_error_money_division_by_zero',
  InvalidAmount: 'value_error_money_invalid_amount',
} as const satisfies Record<string, TErrorKeyPrefix>;

type USpecificMoneyError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class SpecificMoneyError extends ValueError<USpecificMoneyError> {
  constructor(key: USpecificMoneyError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'MoneyError';
  }
}

const moneyError = Object.freeze({
  Error: SpecificMoneyError,
  ...getMappedErrors(EErrorKeys, SpecificMoneyError),
});

export default moneyError;
