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
  cause?: Record<string, unknown>;

  constructor(
    errorKey: Keys,
    message: string,
    cause?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.errorKey = errorKey;
    this.cause = cause;
  }
}

export class ApiError extends AppError {
  name = 'ApiError';
  code: number;

  constructor(code: number, message: string, cause?: Record<string, unknown>) {
    super(message, cause);
    this.code = code;
  }
}

export class ErrorBadRequest extends ApiError {
  constructor(message: string, cause?: Record<string, unknown>) {
    super(400, message, cause);
  }
}

export class ErrorUnauthorized extends ApiError {
  constructor(message?: string, cause?: Record<string, unknown>) {
    super(401, message || 'Unauthorized', cause);
  }
}

export class ErrorPaymentRequired extends ApiError {
  constructor(message: string, cause?: Record<string, unknown>) {
    super(402, message, cause);
  }
}

export class ErrorForbidden extends ApiError {
  constructor(message?: string, cause?: Record<string, unknown>) {
    super(403, message || 'Forbidden', cause);
  }
}

export class ErrorResourceNotFound extends ApiError {
  constructor(message: string, cause?: Record<string, unknown>) {
    super(404, message, cause);
  }
}

export class ErrorConflict extends ApiError {
  constructor(message: string, cause?: Record<string, unknown>) {
    super(409, message, cause);
  }
}

export class ErrorUnprocessableEntity extends ApiError {
  validationErrors: IApiValidationError[];

  constructor(
    validationErrors: IApiValidationError[],
    message?: string,
    cause?: Record<string, unknown>
  ) {
    super(422, message || 'Unprocessable Entity', cause);
    this.validationErrors = validationErrors;
  }
}

export class ErrorTooManyRequests extends ApiError {
  constructor(message: string, cause?: Record<string, unknown>) {
    super(429, message, cause);
  }
}

export class ErrorInternalServerError extends ApiError {
  constructor(message: string, cause?: Record<string, unknown>) {
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
    name: (error as Error).name ?? 'Error',
    message: (error as Error).message ?? 'Unknown error',
    cause: error,
  };
}
