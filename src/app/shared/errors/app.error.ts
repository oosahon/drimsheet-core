import DomainError from '../../../shared/errors/domain.error';
import {
  IApiValidationError,
  TErrorCause,
} from '../../../shared/types/error.types';

type TErrorKeyPrefix = `app_error_${string}`;

const EErrorKeys = {
  InvalidValue: 'app_error_invalid_value',
  BadRequest: 'app_error_bad_request',
  Unauthorized: 'app_error_unauthorized',
  PaymentRequired: 'app_error_payment_required',
  Forbidden: 'app_error_forbidden',
  ResourceNotFound: 'app_error_resource_not_found',
  Conflict: 'app_error_conflict',
  UnprocessableEntity: 'app_error_unprocessable',
  TooManyRequests: 'app_error_too_many_requests',
  InternalServerError: 'app_error_internal_server_error',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UAppError = (typeof EErrorKeys)[keyof typeof EErrorKeys] | TErrorKeyPrefix;

class AppError<K extends TErrorKeyPrefix = UAppError> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'AppError';
  }
}

class BadRequest extends AppError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.BadRequest, cause);
    this.name = 'BadRequest';
  }
}

class Unauthorized extends AppError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.Unauthorized, cause);
    this.name = 'Unauthorized';
  }
}

class PaymentRequired extends AppError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.PaymentRequired, cause);
    this.name = 'PaymentRequired';
  }
}

class Forbidden extends AppError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.Forbidden, cause);
    this.name = 'Forbidden';
  }
}

class ResourceNotFound extends AppError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.ResourceNotFound, cause);
    this.name = 'ResourceNotFound';
  }
}

class Conflict extends AppError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.Conflict, cause);
    this.name = 'Conflict';
  }
}

class UnprocessableEntity extends AppError {
  validationErrors: IApiValidationError[];

  constructor(validationErrors: IApiValidationError[], cause?: TErrorCause) {
    super(EErrorKeys.UnprocessableEntity, cause);
    this.name = 'UnprocessableEntity';
    this.validationErrors = validationErrors;
  }
}

class TooManyRequests extends AppError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.TooManyRequests, cause);
    this.name = 'TooManyRequests';
  }
}

class InternalServerError extends AppError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.InternalServerError, cause);
    this.name = 'InternalServerError';
  }
}

const appError = Object.freeze({
  Base: AppError,
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

export default appError;
