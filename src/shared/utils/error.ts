export type TErrorCause = Record<string, unknown>;

export interface IApiValidationError {
  field: string;
  message: string;
}

export class AppError extends Error {
  message: string;
  cause?: Record<string, unknown>;

  constructor(message: string, cause?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.cause = cause;
  }
}

export class DomainError<Keys extends string> extends Error {
  errorKey: Keys;
  cause?: TErrorCause;

  constructor(errorKey: Keys, message: string, cause?: TErrorCause) {
    super(message);
    this.name = this.constructor.name;
    this.errorKey = errorKey;
    this.cause = cause;
  }
}

export class ApiError extends AppError {
  name = 'ApiError';
  code: number;

  constructor(code: number, message: string, cause?: TErrorCause) {
    super(message, cause);
    this.code = code;
  }
}

export class ErrorBadRequest extends ApiError {
  constructor(message: string, cause?: TErrorCause) {
    super(400, message, cause);
  }
}

export class ErrorUnauthorized extends ApiError {
  constructor(message?: string, cause?: TErrorCause) {
    super(401, message || 'Unauthorized', cause);
  }
}

export class ErrorPaymentRequired extends ApiError {
  constructor(message: string, cause?: TErrorCause) {
    super(402, message, cause);
  }
}

export class ErrorForbidden extends ApiError {
  constructor(message?: string, cause?: TErrorCause) {
    super(403, message || 'Forbidden', cause);
  }
}

export class ErrorResourceNotFound extends ApiError {
  constructor(message: string, cause?: TErrorCause) {
    super(404, message, cause);
  }
}

export class ErrorConflict extends ApiError {
  constructor(message: string, cause?: TErrorCause) {
    super(409, message, cause);
  }
}

export class ErrorUnprocessableEntity extends ApiError {
  validationErrors: IApiValidationError[];

  constructor(
    validationErrors: IApiValidationError[],
    message?: string,
    cause?: TErrorCause
  ) {
    super(422, message || 'Unprocessable Entity', cause);
    this.validationErrors = validationErrors;
  }
}

export class ErrorTooManyRequests extends ApiError {
  constructor(message: string, cause?: TErrorCause) {
    super(429, message, cause);
  }
}

export class ErrorInternalServerError extends ApiError {
  constructor(message: string, cause?: TErrorCause) {
    super(500, message, cause);
  }
}

export function parseError(error: unknown) {
  if (error instanceof ApiError) {
    return {
      type: 'api',
      name: error.name,
      message: error.message,
      cause: error.cause,
      code: error.code,
    };
  }

  if (error instanceof DomainError) {
    return {
      type: 'domain',
      name: error.name,
      errorKey: error.errorKey,
      message: error.message,
      cause: error.cause,
    };
  }

  if (error instanceof AppError) {
    return {
      type: 'domain',
      name: error.name,
      message: error.message,
      cause: error.cause,
    };
  }

  return {
    type: 'unknown',
    name: (error as Error)?.name ?? 'Error',
    message: (error as Error)?.message ?? 'Unknown error',
    cause: error,
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
