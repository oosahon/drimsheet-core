import numberError from '../errors/number.errors';
import { IFactor } from '../types/number.types';

function toBigInt(value: string | number | bigint, error?: Error) {
  if (typeof value === 'number') {
    if (isNaN(value)) {
      throw error || new numberError.InvalidValue({ value });
    }
    if (!Number.isInteger(value)) {
      throw error || new numberError.InvalidFloat({ value });
    }
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      throw error || new numberError.InvalidValue({ value });
    }
    if (trimmed.includes('.')) {
      throw error || new numberError.InvalidFloat({ value });
    }
  }

  try {
    return BigInt(value);
  } catch (err) {
    throw error || new numberError.InvalidValue({ value });
  }
}

function toFloat(value: string | number | bigint, error?: Error) {
  if (typeof value === 'string' && value.trim() === '') {
    throw error || new numberError.InvalidValue({ value });
  }

  const number = Number(value);

  if (isNaN(number)) {
    throw error || new numberError.InvalidValue({ value });
  }

  return number;
}

function toNonNegativeNumber(value: string | number | bigint, error?: Error) {
  const number = toFloat(value, error);

  if (number < 0) {
    throw error || new numberError.NegativeValue({ value });
  }

  return number;
}

function toFactor(value: string | number | bigint, error?: Error): IFactor {
  const number = toFloat(value, error);

  if (!Number.isFinite(number)) {
    throw error || new numberError.InvalidValue({ value });
  }

  const numStr = number.toString();
  let decimalPlaces = 0;

  if (numStr.includes('e')) {
    const [base, exponent] = numStr.split('e');
    const exp = parseInt(exponent, 10);
    const baseDecimals = base.includes('.') ? base.split('.')[1].length : 0;
    decimalPlaces = Math.max(0, baseDecimals - exp);
  } else if (numStr.includes('.')) {
    decimalPlaces = numStr.split('.')[1].length;
  }

  if (decimalPlaces === 0) {
    return { numerator: number, denominator: 1 };
  }

  const denominator = Math.pow(10, decimalPlaces);
  const numerator = Math.round(number * denominator);

  return { numerator, denominator };
}

function isNumber(value: unknown): boolean {
  return typeof value === 'number' && !isNaN(value);
}

function validateNumber(value: string | number | bigint, error?: Error) {
  toFloat(value, error);
}

function isInteger(value: string | number | bigint): boolean {
  return Number.isInteger(toFloat(value));
}

function validateInteger(value: string | number | bigint, error?: Error) {
  if (!isInteger(value)) {
    throw error || new numberError.InvalidFloat({ value });
  }
}

function isPositiveNumber(value: string | number | bigint): boolean {
  return toFloat(value) > 0;
}

function validatePositiveNumber(
  value: string | number | bigint,
  error?: Error
) {
  if (!isPositiveNumber(value)) {
    throw error || new numberError.NonPositiveValue({ value });
  }
}

function isNonNegativeNumber(value: string | number | bigint): boolean {
  return toFloat(value) >= 0;
}

function validateNonNegativeNumber(
  value: string | number | bigint,
  error?: Error
) {
  if (!isNonNegativeNumber(value)) {
    throw error || new numberError.NegativeValue({ value });
  }
}

const numberUtils = Object.freeze({
  toBigInt,
  toFloat,
  toNonNegativeNumber,
  toFactor,
  isNumber,
  validateNumber,
  isInteger,
  validateInteger,
  isPositiveNumber,
  validatePositiveNumber,
  isNonNegativeNumber,
  validateNonNegativeNumber,
});

export default numberUtils;
