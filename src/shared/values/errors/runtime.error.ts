import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';

import DomainError from './domain.error';

const EErrorKeys = {
  ContextNotFound: 'runtime_error_context_context_not_found_unexpected',
  CorrelationIdRequired:
    'runtime_error_context_correlation_id_required_unexpected',
  StoreNotFound: 'runtime_error_context_store_not_found_unexpected',
} as const satisfies TErrorKeys<'runtime_error_context'>;

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
