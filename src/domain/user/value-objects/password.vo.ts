import userValueObjectError from '../errors/user-value-object.errors';

function make(input: unknown): string {
  if (typeof input !== 'string') {
    throw new userValueObjectError.InvalidType({
      input,
    });
  }

  const normalized = input.trim();

  if (normalized.length < 8) {
    throw new userValueObjectError.TooShort({
      input,
    });
  }

  if (normalized.length > 128) {
    throw new userValueObjectError.TooLong({
      input,
    });
  }

  const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s])/;

  if (!complexityRegex.test(normalized)) {
    throw new userValueObjectError.InvalidFormat({
      input,
    });
  }

  return normalized;
}

const passwordValue = Object.freeze({
  make,
});

export default passwordValue;
