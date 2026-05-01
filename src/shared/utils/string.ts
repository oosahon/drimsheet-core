import { v7 as uuid } from 'uuid';
import { z } from 'zod';
import stringError from '../errors/string.error';
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

function validateIsNonEmptyString(value: string, error?: Error) {
  if (!isNonEmptyString(value)) {
    throw error || new stringError.InvalidString({ value });
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

function validateStringWithinRange(
  value: string,
  options: IValidationOptions,
  error?: Error
) {
  if (!isStringWithinRange(value, options)) {
    throw error || new stringError.InvalidString({ value });
  }
}

function sanitizeAndValidateString(
  value: string,
  options: IValidationOptions,
  error?: Error
) {
  if (!isString(value)) {
    throw error || new stringError.InvalidString({ value });
  }
  const schema = z.string().min(options.min).max(options.max);
  const result = schema.safeParse(value.trim());

  if (!result.success) {
    throw error || new stringError.InvalidString({ value });
  }

  return result.data;
}

function isUUID(value: string) {
  return z.uuid().safeParse(value).success;
}

function validateUUID(value: string, error?: Error) {
  if (!isUUID(value)) {
    throw error || new stringError.InvalidUUID({ value });
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

function toUUD(value: string, error?: Error): TEntityId {
  validateUUID(value, error);
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
