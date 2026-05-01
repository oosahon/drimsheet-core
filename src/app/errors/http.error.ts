import DomainError from '../../shared/errors/domain.error';
import {
  IApiValidationError,
  TErrorCause,
} from '../../shared/types/error.types';

type TErrorKeyPrefix = `http_error_${string}`;

const EErrorKeys = {
  InvalidValue: 'http_error_invalid_value',
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

class HttpError extends DomainError<UHttpError> {
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
    this.name = 'BadRequest';
  }
}

class Unauthorized extends HttpError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.Unauthorized, 401, cause);
    this.name = 'Unauthorized';
  }
}

class PaymentRequired extends HttpError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.PaymentRequired, 402, cause);
    this.name = 'PaymentRequired';
  }
}

class Forbidden extends HttpError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.Forbidden, 403, cause);
    this.name = 'Forbidden';
  }
}

class ResourceNotFound extends HttpError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.ResourceNotFound, 404, cause);
    this.name = 'ResourceNotFound';
  }
}

class Conflict extends HttpError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.Conflict, 409, cause);
    this.name = 'Conflict';
  }
}

class UnprocessableEntity extends HttpError {
  validationErrors: IApiValidationError[];

  constructor(validationErrors: IApiValidationError[], cause?: TErrorCause) {
    super(EErrorKeys.UnprocessableEntity, 422, cause);
    this.name = 'UnprocessableEntity';
    this.validationErrors = validationErrors;
  }
}

class TooManyRequests extends HttpError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.TooManyRequests, 429, cause);
    this.name = 'TooManyRequests';
  }
}

class InternalServerError extends HttpError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.InternalServerError, 500, cause);
    this.name = 'InternalServerError';
  }
}

const httpError = Object.freeze({
  Base: HttpError,
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
