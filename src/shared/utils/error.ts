import {
  EErrorKeyStatusSuffix,
  IApiValidationError,
  IParsedError,
  TErrorCause,
  TErrorKey,
  UErrorKeyStatusSuffix,
} from '@shared/types/error.types';

const errorKeyPattern = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/;

function getErrorKeyStatusSuffix(
  value: unknown
): UErrorKeyStatusSuffix | undefined {
  if (typeof value !== 'string' || !errorKeyPattern.test(value)) {
    return undefined;
  }

  return Object.values(EErrorKeyStatusSuffix).find((suffix) =>
    value.endsWith(`_${suffix}`)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiValidationError(value: unknown): value is IApiValidationError {
  return (
    isRecord(value) &&
    typeof value.field === 'string' &&
    typeof value.message === 'string'
  );
}

function parseError(err: unknown): IParsedError {
  const error = isRecord(err) ? err : undefined;
  const rawErrorKey = error?.errorKey;
  const errorKeyStatusSuffix = getErrorKeyStatusSuffix(rawErrorKey);
  const validationErrors = Array.isArray(error?.validationErrors)
    ? error.validationErrors.filter(isApiValidationError)
    : undefined;

  return {
    name:
      typeof error?.name === 'string' && error.name
        ? error.name
        : 'UnknownError',
    cause: isRecord(error?.cause) ? error.cause : undefined,
    errorKey: errorKeyStatusSuffix ? (rawErrorKey as TErrorKey) : undefined,
    errorKeyStatusSuffix,
    validationErrors,
    _raw: err,
  };
}

function getMappedErrors<
  TKeys extends Readonly<Record<string, TErrorKey>>,
  TBase extends new (key: TKeys[keyof TKeys], cause?: TErrorCause) => Error,
>(keys: TKeys, BaseClass: TBase) {
  type GeneratedClass = new (cause?: TErrorCause) => InstanceType<TBase>;
  type SafeBase = new (key: TErrorKey, cause?: TErrorCause) => Error;

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
  getErrorKeyStatusSuffix,
  parseError,
  getMappedErrors,
});

export default errorUtils;
