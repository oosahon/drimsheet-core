export type TErrorCause = Record<string, unknown>;

export interface IApiValidationError {
  field: string;
  message: string;
}

export class DomainError<K extends string> extends Error {
  errorKey: K;
  cause?: TErrorCause;

  constructor(errorKey: K, cause?: TErrorCause) {
    super(errorKey);
    this.name = this.constructor.name;
    this.errorKey = errorKey;
    this.cause = cause;
  }
}

export class AppError<K extends string> extends DomainError<K> {
  constructor(errorKey: K, cause?: TErrorCause) {
    super(errorKey, cause);
  }
}

export function parseError(err: unknown) {
  const errorType = err instanceof DomainError ? 'domain' : 'unknown';
  const error = err as InstanceType<typeof DomainError>;

  return {
    type: errorType,
    name: error?.name ?? 'UnknownError',
    cause: error?.cause ?? null,
    errorKey: error.errorKey ?? null,
    _raw: err,
  };
}

export function getMappedErrors<
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
