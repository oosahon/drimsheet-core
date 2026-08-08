import {
  SYSTEM_CURRENCIES,
  UCurrencyCode,
} from '@domain/money/config/currencies.config';
import currencyError from '@domain/money/errors/currency.error';

function isValidCurrencyCode(code: string): boolean {
  return code in SYSTEM_CURRENCIES;
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function isValidMinorUnit(minorUnit: number): boolean {
  return Number.isInteger(minorUnit) && minorUnit >= 0 && minorUnit <= 8;
}

function validateCurrencyCode(code: string) {
  if (!isValidCurrencyCode(code)) {
    throw new currencyError.InvalidCode({ code });
  }
}

function getByCode(code: string) {
  const normalizedCode = normalizeCode(code);
  const currency = SYSTEM_CURRENCIES[normalizedCode as UCurrencyCode];
  if (!currency) {
    throw new currencyError.InvalidCode({ code });
  }

  return currency;
}

const currencyEntity = Object.freeze({
  isValidCode: isValidCurrencyCode,
  isValidMinorUnit,
  validateCode: validateCurrencyCode,
  normalizeCode,
  getByCode,
});

export default currencyEntity;
