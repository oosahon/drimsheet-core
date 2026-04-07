import { IFactor } from '../types/number.types';
import { AppError } from '../value-objects/error';

function toBigInt(value: string | number | bigint) {
  if (typeof value === 'number') {
    if (isNaN(value)) {
      throw new AppError('Invalid value', { cause: value });
    }
    if (!Number.isInteger(value)) {
      throw new AppError('Value must not be a float', { cause: value });
    }
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      throw new AppError('Invalid value', { cause: value });
    }
    if (trimmed.includes('.')) {
      throw new AppError('Value must not be a float', { cause: value });
    }
  }

  try {
    return BigInt(value);
  } catch (error) {
    throw new AppError('Invalid value', { cause: value });
  }
}

function toFloat(value: string | number | bigint) {
  if (typeof value === 'string' && value.trim() === '') {
    throw new AppError('Invalid value', { cause: value });
  }

  const number = Number(value);

  if (isNaN(number)) {
    throw new AppError('Invalid value', { cause: value });
  }

  return number;
}

function toNonNegativeNumber(value: string | number | bigint) {
  const number = toFloat(value);

  if (number < 0) {
    throw new AppError('Value must not be negative', { cause: value });
  }

  return number;
}

function toFactor(value: string | number | bigint): IFactor {
  const number = toFloat(value);

  if (!Number.isFinite(number)) {
    throw new AppError('Invalid value', { cause: value });
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

const numberUtils = Object.freeze({
  toBigInt,
  toFloat,
  toNonNegativeNumber,
  toFactor,
});

export default numberUtils;
