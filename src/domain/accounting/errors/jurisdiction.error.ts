import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';

import accountingError from './accounting.error';

const EErrorKeys = {
  Invalid: 'accounting_error_jurisdiction_invalid',
} as const satisfies TErrorKeys<'accounting_error_jurisdiction'>;

type UJurisdictionError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class JurisdictionError extends accountingError.Base<UJurisdictionError> {
  constructor(key: UJurisdictionError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'JurisdictionError';
  }
}

const jurisdictionError = Object.freeze({
  Base: JurisdictionError,
  ...errorUtils.getMappedErrors(EErrorKeys, JurisdictionError),
});

export default jurisdictionError;
