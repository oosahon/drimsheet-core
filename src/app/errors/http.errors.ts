import AppError from '../../shared/errors/app.error';
import {
  IApiValidationError,
  TErrorCause,
} from '../../shared/types/error.types';

type TErrorKeyPrefix = `http_error_${string}`;

const EErrorKeys = {
  BadRequest: 'http_error_bad_request',
  Unauthorized: 'http_error_unauthorized',
  PaymentRequired: 'http_error_payment_required',
  Forbidden: 'http_error_forbidden',
  ResourceNotFound: 'http_error_resource_not_found',
  Conflict: 'http_error_conflict',
  UnprocessableEntity: 'http_error_unprocessable_entity',
  TooManyRequests: 'http_error_too_many_requests',
  InternalServerError: 'http_error_internal_server_error',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UHttpError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class HttpError extends AppError<UHttpError> {
  errorKey: UHttpError;
  code: number;
  constructor(key: UHttpError, code: number, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'HttpError';
    this.code = code;
    this.errorKey = key;
  }
}

class BadRequest extends HttpError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.BadRequest, 400, cause);
  }
}

class Unauthorized extends HttpError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.Unauthorized, 401, cause);
  }
}

class PaymentRequired extends HttpError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.PaymentRequired, 402, cause);
  }
}

class Forbidden extends HttpError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.Forbidden, 403, cause);
  }
}

class ResourceNotFound extends HttpError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.ResourceNotFound, 404, cause);
  }
}

class Conflict extends HttpError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.Conflict, 409, cause);
  }
}

class UnprocessableEntity extends HttpError {
  validationErrors: IApiValidationError[];

  constructor(validationErrors: IApiValidationError[], cause?: TErrorCause) {
    super(EErrorKeys.UnprocessableEntity, 422, cause);
    this.validationErrors = validationErrors;
  }
}

class TooManyRequests extends HttpError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.TooManyRequests, 429, cause);
  }
}

class InternalServerError extends HttpError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.InternalServerError, 500, cause);
  }
}

const httpError = Object.freeze({
  Error: HttpError,
  BadRequest,
  Unauthorized,
  PaymentRequired,
  Forbidden,
  ResourceNotFound,
  Conflict,
  UnprocessableEntity,
  TooManyRequests,
  InternalServerError,
});

export default httpError;
