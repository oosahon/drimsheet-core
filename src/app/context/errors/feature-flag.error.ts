import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import DomainError from '@shared/values/errors/domain.error';

const EErrorKeys = {
  NotPermitted: 'feature_flag_error_forbidden',
} as const satisfies TErrorKeys<'feature_flag_error'>;

type UErrorKeys = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class FeatureFlagError extends DomainError<UErrorKeys> {
  constructor(key: UErrorKeys, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'FeatureFlagError';
  }
}

const featureFlagError = Object.freeze({
  Base: FeatureFlagError,
  ...errorUtils.getMappedErrors(EErrorKeys, FeatureFlagError),
});

export default featureFlagError;
