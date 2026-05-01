import AppError from '../../shared/errors/app.error';
import { TErrorCause } from '../../shared/types/error.types';
import errorUtils from '../../shared/utils/error';

type TErrorKeyPrefix = `app_error_context_${string}`;

const EErrorKeys = {
  InvalidValue: 'app_error_context_invalid_value',
  ContextNotFound: 'app_error_context_context_not_found',
  CorrelationIdRequired: 'app_error_context_correlation_id_required',
  StoreNotFound: 'app_error_context_store_not_found',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UContextError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class ContextError extends AppError<UContextError> {
  constructor(key: UContextError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'ContextError';
  }
}

const contextError = Object.freeze({
  Base: ContextError,
  ...errorUtils.getMappedErrors(EErrorKeys, ContextError),
});

export default contextError;
