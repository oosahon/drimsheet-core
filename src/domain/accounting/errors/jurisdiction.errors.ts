import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';
import AccountingError from './accounting.error';

type TErrorKeyPrefix = `accounting_error_jurisdiction_${string}`;

const EErrorKeys = {
  Invalid: 'accounting_error_jurisdiction_invalid',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UJurisdictionError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class JurisdictionError extends AccountingError<UJurisdictionError> {
  constructor(key: UJurisdictionError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const jurisdictionError = Object.freeze({
  Base: JurisdictionError,
  ...errorUtils.getMappedErrors(EErrorKeys, JurisdictionError),
});

export default jurisdictionError;
