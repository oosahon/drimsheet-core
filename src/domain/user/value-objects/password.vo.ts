import { AppError } from '../../../shared/value-objects/error';

function make(input: unknown): string {
  if (typeof input !== 'string') {
    throw new AppError('Password must be a string', {
      cause: input,
    });
  }

  const normalized = input.trim();

  if (normalized.length < 8) {
    throw new AppError('Password is too short', {
      cause: input,
    });
  }

  if (normalized.length > 128) {
    throw new AppError('Password is too long', {
      cause: input,
    });
  }

  const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s])/;

  if (!complexityRegex.test(normalized)) {
    throw new AppError('Password is too easy', {
      cause: input,
    });
  }

  return normalized;
}

const passwordValue = Object.freeze({
  make,
});

export default passwordValue;
