import { IFactor } from '../../../shared/types/number.types';
import currencyEntity from '../entities/currency.entity';
import moneyError from '../errors/money.error';
import { ICurrency } from '../types/currency.types';
import { IMoney } from '../types/money.types';

// TODO (i18n): translate error messages

/**
 * Checks if the factor is valid.
 */
function isValidFactor(factor: IFactor) {
  return (
    Number.isSafeInteger(factor.numerator) &&
    Number.isSafeInteger(factor.denominator) &&
    factor.denominator > 0
  );
}

/**
 * Normalizes an amount to its minor unit.
 */
function getNormalizedMinorUnit(amount: bigint | number, currency: ICurrency) {
  const normalizer = 10n ** currency.minorUnit;
  const normalizedAmount = Math.round(
    Number.parseFloat(amount.toString()) * Number(normalizer)
  );

  if (!Number.isSafeInteger(normalizedAmount)) {
    throw new moneyError.NonNormalizableAmount({
      amount,
      currency,
    });
  }

  return BigInt(normalizedAmount);
}

/**
 * Creates a new money object.
 */
function make(
  amount: bigint | number,
  currency: ICurrency,
  isInMinorUnit: boolean
) {
  const isValidCurrencyCode = currencyEntity.isValidCode(currency.code);

  if (!isValidCurrencyCode) {
    throw new moneyError.InvalidCurrencyCode({ currencyCode: currency.code });
  }

  if (
    isInMinorUnit &&
    typeof amount === 'number' &&
    !Number.isSafeInteger(amount)
  ) {
    throw new moneyError.FractionalMinorUnit({ amount });
  }

  const computedAmount = isInMinorUnit
    ? BigInt(amount)
    : getNormalizedMinorUnit(amount, currency);

  return Object.freeze({
    amount: computedAmount,
    currency,
  });
}

/**
 * Creates a new money object with zero amount.
 */

function makeZeroAmount(currency: ICurrency) {
  return make(0, currency, true);
}

/**
 * Checks if all money objects have the same currency.
 */
function isSameCurrency(...args: IMoney[]) {
  if (!args.length) return false;
  return args.every((a) => a.currency.code === args[0].currency.code);
}

/**
 * Adds money objects.
 */
function add(...args: IMoney[]): IMoney {
  if (!args.length) {
    throw new moneyError.MissingArguments();
  }

  if (!isSameCurrency(...args)) {
    throw new moneyError.CurrencyMismatch({
      args,
    });
  }

  const result = args.reduce((acc, param) => acc + param.amount, BigInt(0));

  const currency = args[0].currency;
  return make(result, currency, true);
}

/**
 * Subtracts money objects.
 */
function subtract(...args: IMoney[]): IMoney {
  if (!args.length) {
    throw new moneyError.MissingArguments();
  }

  if (!isSameCurrency(...args)) {
    throw new moneyError.CurrencyMismatch({
      args,
    });
  }

  const [first, ...rest] = args;
  const result = rest.reduce((acc, p) => acc - p.amount, first.amount);
  const currency = first.currency;

  return make(result, currency, true);
}

/**
 * Multiplies money objects.
 */
function multiply(money: IMoney, factor: IFactor): IMoney {
  if (!isValidFactor(factor)) {
    throw new moneyError.InvalidFactor({ factor });
  }

  const result =
    (money.amount * BigInt(factor.numerator)) / BigInt(factor.denominator);
  return make(result, money.currency, true);
}

/**
 * Divides money objects.
 */
function divide(
  money: IMoney,
  divisor: IFactor
): { value: IMoney; remainder: IMoney } {
  if (divisor.numerator === 0) {
    throw new moneyError.DivisionByZero({ divisor });
  }

  if (!isValidFactor(divisor)) {
    throw new moneyError.InvalidFactor({ divisor });
  }

  const numerator = BigInt(divisor.denominator);
  const denominator = BigInt(divisor.numerator);

  const result = (money.amount * numerator) / denominator;
  const remainder = (money.amount * numerator) % denominator;

  return {
    value: make(result, money.currency, true),
    remainder: make(remainder, money.currency, true),
  };
}

function validate(money: IMoney) {
  if (typeof money.amount !== 'bigint') {
    throw new moneyError.InvalidAmount({ amount: money.amount });
  }

  if (!currencyEntity.isValidCode(money.currency.code)) {
    throw new moneyError.InvalidCurrencyCode({
      currencyCode: money.currency.code,
    });
  }
}

function equals(money: IMoney, other: IMoney) {
  return (
    money.amount === other.amount && money.currency.code === other.currency.code
  );
}

function min(...args: IMoney[]) {
  if (!args.length) {
    throw new moneyError.MissingArguments();
  }

  if (!isSameCurrency(...args)) {
    throw new moneyError.CurrencyMismatch({
      args,
    });
  }

  return args.reduce((acc, param) => (acc.amount < param.amount ? acc : param));
}

function max(...args: IMoney[]) {
  if (!args.length) {
    throw new moneyError.MissingArguments();
  }

  if (!isSameCurrency(...args)) {
    throw new moneyError.CurrencyMismatch({
      args,
    });
  }

  return args.reduce((acc, param) => (acc.amount > param.amount ? acc : param));
}

function isGreaterThan(money: IMoney, other: IMoney) {
  if (!isSameCurrency(money, other)) {
    throw new moneyError.CurrencyMismatch({
      money,
      other,
    });
  }

  return money.amount > other.amount;
}

function isLessThan(money: IMoney, other: IMoney) {
  if (!isSameCurrency(money, other)) {
    throw new moneyError.CurrencyMismatch({
      money,
      other,
    });
  }

  return money.amount < other.amount;
}

function sortDescending(...args: IMoney[]) {
  if (!args.length) {
    throw new moneyError.MissingArguments();
  }

  if (!isSameCurrency(...args)) {
    throw new moneyError.CurrencyMismatch({
      args,
    });
  }

  return args.sort((a, b) => Number(b.amount - a.amount));
}

function sortAscending(...args: IMoney[]) {
  if (!args.length) {
    throw new moneyError.MissingArguments();
  }

  if (!isSameCurrency(...args)) {
    throw new moneyError.CurrencyMismatch({
      args,
    });
  }

  return args.sort((a, b) => Number(a.amount - b.amount));
}

function convert(
  money: IMoney,
  factor: IFactor,
  targetCurrencyCode: ICurrency
) {
  const amount = multiply(money, factor);
  return make(amount.amount, targetCurrencyCode, true);
}

function isZeroAmount(money: IMoney) {
  return money.amount === 0n;
}

const moneyValue = Object.freeze({
  make,
  makeZeroAmount,
  isSameCurrency,
  add,
  subtract,
  divide,
  multiply,
  validate,
  equals,
  min,
  max,
  isGreaterThan,
  isLessThan,
  sortDescending,
  sortAscending,
  convert,
  isZeroAmount,
});

export default moneyValue;
