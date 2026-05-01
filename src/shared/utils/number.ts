import { TErrorConstructor } from '../types/error.types';
import { IFactor } from '../types/number.types';

function toBigInt<T extends Error>(
  value: string | number | bigint,
  ErrorClass: TErrorConstructor<T>
) {
  if (typeof value === 'number') {
    if (isNaN(value)) {
      throw new ErrorClass({ value });
    }
    if (!Number.isInteger(value)) {
      throw new ErrorClass({ value });
    }
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      throw new ErrorClass({ value });
    }
    if (trimmed.includes('.')) {
      throw new ErrorClass({ value });
    }
  }

  try {
    return BigInt(value);
  } catch (err) {
    throw new ErrorClass({ value });
  }
}

function toFloat<T extends Error>(
  value: string | number | bigint,
  ErrorClass: TErrorConstructor<T>
) {
  if (typeof value === 'string' && value.trim() === '') {
    throw new ErrorClass({ value });
  }

  const number = Number(value);

  if (isNaN(number)) {
    throw new ErrorClass({ value });
  }

  return number;
}

function toNonNegativeNumber<T extends Error>(
  value: string | number | bigint,
  ErrorClass: TErrorConstructor<T>
) {
  const number = toFloat(value, ErrorClass);

  if (number < 0) {
    throw new ErrorClass({ value });
  }

  return number;
}

function toFactor<T extends Error>(
  value: string | number | bigint,
  ErrorClass: TErrorConstructor<T>
): IFactor {
  const number = toFloat(value, ErrorClass);

  if (!Number.isFinite(number)) {
    throw new ErrorClass({ value });
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

function validateNumber<T extends Error>(
  value: string | number | bigint,
  ErrorClass: TErrorConstructor<T>
) {
  toFloat(value, ErrorClass);
}

function isInteger(value: string | number | bigint): boolean {
  try {
    const num = Number(value);
    return Number.isInteger(num);
  } catch {
    return false;
  }
}

function validateInteger<T extends Error>(
  value: string | number | bigint,
  ErrorClass: TErrorConstructor<T>
) {
  if (!isInteger(value)) {
    throw new ErrorClass({ value });
  }
}

function isPositiveNumber(value: string | number | bigint): boolean {
  try {
    const num = Number(value);
    return !isNaN(num) && num > 0;
  } catch {
    return false;
  }
}

function validatePositiveNumber<T extends Error>(
  value: string | number | bigint,
  ErrorClass: TErrorConstructor<T>
) {
  if (!isPositiveNumber(value)) {
    throw new ErrorClass({ value });
  }
}

function isNonNegativeNumber(value: string | number | bigint): boolean {
  try {
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  } catch {
    return false;
  }
}

function validateNonNegativeNumber<T extends Error>(
  value: string | number | bigint,
  ErrorClass: TErrorConstructor<T>
) {
  if (!isNonNegativeNumber(value)) {
    throw new ErrorClass({ value });
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
