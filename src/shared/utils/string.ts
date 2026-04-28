import { v7 as uuid } from 'uuid';
import { z } from 'zod';
import { AppError } from '../errors/error';
import { TEntityId } from '../types/uuid';

interface IValidationOptions {
  min: number;
  max: number;
  sanitize?: boolean;
}

function isString(value: string) {
  return typeof value === 'string';
}

function isNonEmptyString(value: string) {
  return isString(value) && value.trim().length > 0;
}

function validateIsNonEmptyString(value: string, message?: string) {
  if (!isNonEmptyString(value)) {
    throw new AppError(message ?? 'Invalid string', { cause: value });
  }
}

function isStringWithinRange(value: string, options: IValidationOptions) {
  if (!isString(value)) {
    return false;
  }
  const schema = z.string().min(options.min).max(options.max);
  const result = schema.safeParse(options.sanitize ? value.trim() : value);

  if (!result.success) {
    return false;
  }

  return true;
}

function validateStringWithinRange(value: string, options: IValidationOptions) {
  if (!isStringWithinRange(value, options)) {
    throw new AppError('Invalid string', { cause: value });
  }
}

function sanitizeAndValidateString(value: string, options: IValidationOptions) {
  if (!isString(value)) {
    throw new AppError('Invalid string', { cause: value });
  }
  const schema = z.string().min(options.min).max(options.max);
  const result = schema.safeParse(value.trim());

  if (!result.success) {
    throw new AppError('Invalid string', { cause: value });
  }

  return result.data;
}

function isUUID(value: string) {
  return z.uuid().safeParse(value).success;
}

function validateUUID(value: string, message?: string) {
  if (!isUUID(value)) {
    throw new AppError(message ?? 'Invalid UUID', { cause: value });
  }
}

function isNumeric(value: string) {
  return /^[0-9]+$/.test(value);
}

function isUrl(value: string) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function toUUD(value: string): TEntityId {
  validateUUID(value);
  return value as TEntityId;
}

function generateUUID(): TEntityId {
  return uuid() as TEntityId;
}

const stringUtils = Object.freeze({
  sanitizeAndValidate: sanitizeAndValidateString,
  isUUID,
  isNonEmptyString,
  validateIsNonEmptyString,
  validateUUID,
  generateUUID,
  toUUD,
  isNumeric,
  isUrl,
  isStringWithinRange,
  validateStringWithinRange,
});

export default stringUtils;
