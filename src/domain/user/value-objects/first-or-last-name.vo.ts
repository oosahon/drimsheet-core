import userValueObjectError from '../errors/user-value-object.errors';

export type FirstOrLastName = string & { readonly __brand: unique symbol };

function make(input: unknown): FirstOrLastName {
  if (typeof input !== 'string') {
    throw new userValueObjectError.InvalidType({
      cause: input,
    });
  }

  const normalized = input.trim().replace(/\s+/g, ' ').normalize('NFC');

  if (normalized.length < 1) {
    throw new userValueObjectError.TooShort({
      cause: input,
    });
  }

  if (normalized.length > 128) {
    throw new userValueObjectError.TooLong({
      cause: input,
    });
  }

  const validCharsRegex = /^[\p{L}\p{M}\s'-]+$/u;
  const hasLetterRegex = /[\p{L}]/u;

  if (!validCharsRegex.test(normalized) || !hasLetterRegex.test(normalized)) {
    throw new userValueObjectError.InvalidFormat({
      cause: input,
    });
  }

  return normalized as FirstOrLastName;
}

const firstOrLastNameValue = Object.freeze({
  make,
});

export default firstOrLastNameValue;
