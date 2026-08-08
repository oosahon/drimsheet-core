import { TErrorCause } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';

import DomainError from './domain.error';

type TErrorKeyPrefix = `runtime_error_context_${string}`;

const EErrorKeys = {
  InvalidValue: 'runtime_error_context_invalid_value',
  ContextNotFound: 'runtime_error_context_context_not_found',
  CorrelationIdRequired: 'runtime_error_context_correlation_id_required',
  StoreNotFound: 'runtime_error_context_store_not_found',
} as const satisfies Record<string, TErrorKeyPrefix>;

type URuntimeError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class RuntimeError extends DomainError<URuntimeError> {
  constructor(key: URuntimeError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'RuntimeError';
  }
}

const runtimeError = Object.freeze({
  Base: RuntimeError,
  ...errorUtils.getMappedErrors(EErrorKeys, RuntimeError),
});

export default runtimeError;
