import { AppError } from '../../../shared/value-objects/error';

function isValidCurrencyCode(code: string): boolean {
  const isInvalidFormat =
    typeof code !== 'string' ||
    code.length !== 3 ||
    code !== code.toUpperCase();

  if (isInvalidFormat) {
    return false;
  }

  try {
    const dn = new Intl.DisplayNames(['en'], {
      type: 'currency',
      fallback: 'none',
    });
    return dn.of(code) !== undefined;
  } catch {
    return false;
  }
}

function isValidMinorUnit(minorUnit: number): boolean {
  return Number.isInteger(minorUnit) && minorUnit >= 0 && minorUnit <= 8;
}

function validateCurrencyCode(code: string) {
  if (!isValidCurrencyCode(code)) {
    throw new AppError('Invalid currency code', { cause: code });
  }
}

const currencyEntity = Object.freeze({
  isValidCode: isValidCurrencyCode,
  isValidMinorUnit,
  validateCode: validateCurrencyCode,
});

export default currencyEntity;
