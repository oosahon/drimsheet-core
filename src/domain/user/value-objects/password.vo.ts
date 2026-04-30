import userValueObjectError from '../errors/user-value-object.errors';

function make(input: unknown): string {
  if (typeof input !== 'string') {
    throw new userValueObjectError.InvalidType({
      cause: input,
    });
  }

  const normalized = input.trim();

  if (normalized.length < 8) {
    throw new userValueObjectError.TooShort({
      cause: input,
    });
  }

  if (normalized.length > 128) {
    throw new userValueObjectError.TooLong({
      cause: input,
    });
  }

  const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s])/;

  if (!complexityRegex.test(normalized)) {
    throw new userValueObjectError.InvalidFormat({
      cause: input,
    });
  }

  return normalized;
}

const passwordValue = Object.freeze({
  make,
});

export default passwordValue;
