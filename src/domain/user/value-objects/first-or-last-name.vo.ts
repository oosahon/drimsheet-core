import { AppError } from '../../../shared/value-objects/error';

export type FirstOrLastName = string & { readonly __brand: unique symbol };

function make(input: unknown): FirstOrLastName {
  if (typeof input !== 'string') {
    throw new AppError('Name must be a string', {
      cause: input,
    });
  }

  const normalized = input.trim().replace(/\s+/g, ' ').normalize('NFC');

  if (normalized.length < 1) {
    throw new AppError('Name is too short', {
      cause: input,
    });
  }

  if (normalized.length > 128) {
    throw new AppError('Name is too long', {
      cause: input,
    });
  }

  const validCharsRegex = /^[\p{L}\p{M}\s'-]+$/u;
  const hasLetterRegex = /[\p{L}]/u;

  if (!validCharsRegex.test(normalized) || !hasLetterRegex.test(normalized)) {
    throw new AppError('Name is invalid', {
      cause: input,
    });
  }

  return normalized as FirstOrLastName;
}

const firstOrLastNameValue = Object.freeze({
  make,
});

export default firstOrLastNameValue;
