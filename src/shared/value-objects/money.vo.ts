import { AppError } from './error';
import { IMoney } from '../types/money.types';
import { ICurrency } from '../../domain/currency/types/currency.types';
import currencyEntity from '../../domain/currency/entities/currency.entity';
import { IFactor } from '../types/number.types';

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
    throw new AppError('Provide normalizable amount', {
      cause: { amount, currency },
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
    throw new AppError('Invalid currency code', { cause: currency.code });
  }

  if (
    isInMinorUnit &&
    typeof amount === 'number' &&
    !Number.isSafeInteger(amount)
  ) {
    throw new AppError('Provide a non-fractional amount', { cause: amount });
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
    throw new AppError('Provide at least one parameter for addition');
  }

  if (!isSameCurrency(...args)) {
    throw new AppError('Please provide money objects with the same currency', {
      cause: args,
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
    throw new AppError('Provide at least one parameter for subtraction');
  }

  if (!isSameCurrency(...args)) {
    throw new AppError('Please provide money objects with the same currency', {
      cause: args,
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
    throw new AppError('Please provide a valid factor', { cause: factor });
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
    throw new AppError('Cannot divide by zero', { cause: divisor });
  }

  if (!isValidFactor(divisor)) {
    throw new AppError('Please provide a valid factor', { cause: divisor });
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
    throw new AppError('Invalid amount', { cause: money.amount });
  }

  if (!currencyEntity.isValidCode(money.currency.code)) {
    throw new AppError('Invalid currency code', { cause: money.currency.code });
  }
}

function equals(money: IMoney, other: IMoney) {
  return (
    money.amount === other.amount && money.currency.code === other.currency.code
  );
}

function min(...args: IMoney[]) {
  if (!args.length) {
    throw new AppError('Provide at least one parameter for minimum');
  }

  if (!isSameCurrency(...args)) {
    throw new AppError('Please provide money objects with the same currency', {
      cause: args,
    });
  }

  return args.reduce((acc, param) => (acc.amount < param.amount ? acc : param));
}

function max(...args: IMoney[]) {
  if (!args.length) {
    throw new AppError('Provide at least one parameter for maximum');
  }

  if (!isSameCurrency(...args)) {
    throw new AppError('Please provide money objects with the same currency', {
      cause: args,
    });
  }

  return args.reduce((acc, param) => (acc.amount > param.amount ? acc : param));
}

function isGreaterThan(money: IMoney, other: IMoney) {
  if (!isSameCurrency(money, other)) {
    throw new AppError('Please provide money objects with the same currency', {
      cause: [money, other],
    });
  }

  return money.amount > other.amount;
}

function isLessThan(money: IMoney, other: IMoney) {
  if (!isSameCurrency(money, other)) {
    throw new AppError('Please provide money objects with the same currency', {
      cause: [money, other],
    });
  }

  return money.amount < other.amount;
}

function sortDescending(...args: IMoney[]) {
  if (!args.length) {
    throw new AppError('Provide at least one parameter for sorting');
  }

  if (!isSameCurrency(...args)) {
    throw new AppError('Please provide money objects with the same currency', {
      cause: args,
    });
  }

  return args.sort((a, b) => Number(b.amount - a.amount));
}

function sortAscending(...args: IMoney[]) {
  if (!args.length) {
    throw new AppError('Provide at least one parameter for sorting');
  }

  if (!isSameCurrency(...args)) {
    throw new AppError('Please provide money objects with the same currency', {
      cause: args,
    });
  }

  return args.sort((a, b) => Number(a.amount - b.amount));
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
});

export default moneyValue;
