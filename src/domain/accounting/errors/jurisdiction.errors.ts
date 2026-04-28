import { AccountingError } from '.';
import { TErrorCause } from '../../../shared/errors/error';

type TErrorKeyPrefix = `accounting_error_jurisdiction_${string}`;

const EErrorKeys = {
  Invalid: 'accounting_error_jurisdiction_invalid',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UErrorKey = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class JurisdictionError extends AccountingError<UErrorKey> {
  constructor(key: UErrorKey, cause?: TErrorCause) {
    super(key, cause);
  }
}

class InvalidJurisdictionError extends JurisdictionError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.Invalid, cause);
  }
}

const jurisdictionError = Object.freeze({
  Error: JurisdictionError,
  InvalidJurisdiction: InvalidJurisdictionError,
});

export default jurisdictionError;
