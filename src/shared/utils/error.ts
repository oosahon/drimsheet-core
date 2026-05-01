import DomainError from '../errors/domain.error';
import { IParsedError, TErrorCause } from '../types/error.types';

function parseError(err: unknown): IParsedError {
  const error = err as InstanceType<typeof DomainError>;

  return {
    name: error.name || 'UnknownError',
    cause: error.cause,
    errorKey: error.errorKey,
    _raw: err,
  };
}

function getMappedErrors<
  TKeys extends Record<string, string>,
  TBase extends new (key: TKeys[keyof TKeys], cause?: TErrorCause) => Error,
>(keys: TKeys, BaseClass: TBase) {
  type GeneratedClass = new (cause?: TErrorCause) => InstanceType<TBase>;
  type SafeBase = new (key: string, cause?: TErrorCause) => Error;

  return Object.entries(keys).reduce(
    (acc, [key, value]) => {
      acc[key as keyof TKeys] =
        class extends (BaseClass as unknown as SafeBase) {
          constructor(cause?: TErrorCause) {
            super(value, cause);
          }
        } as unknown as GeneratedClass;
      return acc;
    },
    {} as Record<keyof TKeys, GeneratedClass>
  );
}

const errorUtils = Object.freeze({
  parseError,
  getMappedErrors,
});

export default errorUtils;
