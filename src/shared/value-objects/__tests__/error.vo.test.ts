import {
  ApiError,
  AppError,
  DomainError,
  ErrorBadRequest,
  ErrorConflict,
  ErrorForbidden,
  ErrorInternalServerError,
  ErrorPaymentRequired,
  ErrorResourceNotFound,
  ErrorTooManyRequests,
  ErrorUnauthorized,
  ErrorUnprocessableEntity,
  parseError,
} from '../error';

describe('Error Value Objects', () => {
  describe('AppError', () => {
    it('creates an AppError with message', () => {
      const error = new AppError('Test error message');
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error message');
      expect(error.cause).toBeUndefined();
    });

    it('creates an AppError with message and cause', () => {
      const cause = { detail: 'Something went wrong' };
      const error = new AppError('Test error mechanism', cause);
      expect(error.message).toBe('Test error mechanism');
      expect(error.cause).toBe(cause);
    });
  });

  describe('DomainError', () => {
    it('creates a DomainError with errorKey, message, and cause', () => {
      const cause = { detail: 'Domain specific issue' };
      const error = new DomainError(
        'TEST_ERROR',
        'Test domain error message',
        cause
      );
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DomainError');
      expect(error.errorKey).toBe('TEST_ERROR');
      expect(error.message).toBe('Test domain error message');
      expect(error.cause).toBe(cause);
    });

    it('creates a DomainError without cause', () => {
      const error = new DomainError('TEST_ERROR', 'Test domain error message');
      expect(error.errorKey).toBe('TEST_ERROR');
      expect(error.message).toBe('Test domain error message');
      expect(error.cause).toBeUndefined();
    });
  });

  describe('ApiError', () => {
    it('creates an ApiError with code, message, and cause', () => {
      const cause = { info: 'Test' };
      const error = new ApiError(500, 'Server Error', cause);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('ApiError');
      expect(error.code).toBe(500);
      expect(error.message).toBe('Server Error');
      expect(error.cause).toBe(cause);
    });

    it('creates an ApiError without cause', () => {
      const error = new ApiError(400, 'Bad Input');
      expect(error.code).toBe(400);
      expect(error.message).toBe('Bad Input');
      expect(error.cause).toBeUndefined();
    });
  });

  describe('HTTP Errors', () => {
    it('ErrorBadRequest sets code to 400', () => {
      const cause = { field: 'email' };
      const error = new ErrorBadRequest('Invalid Request', cause);
      expect(error).toBeInstanceOf(ErrorBadRequest);
      expect(error.code).toBe(400);
      expect(error.message).toBe('Invalid Request');
      expect(error.cause).toBe(cause);
    });

    it('ErrorUnauthorized sets code to 401', () => {
      const error = new ErrorUnauthorized('Not allowed');
      expect(error).toBeInstanceOf(ErrorUnauthorized);
      expect(error.code).toBe(401);
      expect(error.message).toBe('Not allowed');

      const error2 = new ErrorUnauthorized();
      expect(error2).toBeInstanceOf(ErrorUnauthorized);
      expect(error2.code).toBe(401);
      expect(error2.message).toBe('Unauthorized');
    });

    it('ErrorPaymentRequired sets code to 402', () => {
      const error = new ErrorPaymentRequired('Payment Needed');
      expect(error).toBeInstanceOf(ErrorPaymentRequired);
      expect(error.code).toBe(402);
      expect(error.message).toBe('Payment Needed');
    });

    it('ErrorForbidden sets code to 403', () => {
      const cause = { userRole: 'guest' };
      const error = new ErrorForbidden('Forbidden access', cause);
      expect(error).toBeInstanceOf(ErrorForbidden);
      expect(error.code).toBe(403);
      expect(error.message).toBe('Forbidden access');
      expect(error.cause).toBe(cause);

      const errorWithoutMessage = new ErrorForbidden();
      expect(errorWithoutMessage.message).toBe('Forbidden');
    });

    it('ErrorResourceNotFound sets code to 404', () => {
      const error = new ErrorResourceNotFound('Not Found');
      expect(error).toBeInstanceOf(ErrorResourceNotFound);
      expect(error.code).toBe(404);
      expect(error.message).toBe('Not Found');
    });

    it('ErrorConflict sets code to 409', () => {
      const error = new ErrorConflict('Conflict occurred');
      expect(error).toBeInstanceOf(ErrorConflict);
      expect(error.code).toBe(409);
      expect(error.message).toBe('Conflict occurred');
    });

    it('ErrorInternalServerError sets code to 500', () => {
      const error = new ErrorInternalServerError('Internal Failure');
      expect(error).toBeInstanceOf(ErrorInternalServerError);
      expect(error.code).toBe(500);
      expect(error.message).toBe('Internal Failure');
    });

    it('ErrorTooManyRequests sets code to 429', () => {
      const cause = { retryAfter: '60s' };
      const error = new ErrorTooManyRequests('Rate limit exceeded', cause);
      expect(error).toBeInstanceOf(ErrorTooManyRequests);
      expect(error.code).toBe(429);
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.cause).toBe(cause);
    });

    it('ErrorTooManyRequests sets code to 429 without cause', () => {
      const error = new ErrorTooManyRequests('Rate limit exceeded');
      expect(error).toBeInstanceOf(ErrorTooManyRequests);
      expect(error.code).toBe(429);
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.cause).toBeUndefined();
    });
  });

  describe('ErrorUnprocessableEntity', () => {
    const validationErrors = [{ field: 'email', message: 'Invalid email' }];

    it('creates an ErrorUnprocessableEntity with default message if none is provided', () => {
      const error = new ErrorUnprocessableEntity(validationErrors);
      expect(error).toBeInstanceOf(ErrorUnprocessableEntity);
      expect(error.code).toBe(422);
      expect(error.message).toBe('Unprocessable Entity'); // Fallback check
      expect(error.validationErrors).toBe(validationErrors);
      expect(error.cause).toBeUndefined();
    });

    it('creates an ErrorUnprocessableEntity with custom message', () => {
      const error = new ErrorUnprocessableEntity(
        validationErrors,
        'Validation Failed'
      );
      expect(error.code).toBe(422);
      expect(error.message).toBe('Validation Failed');
      expect(error.validationErrors).toBe(validationErrors);
    });

    it('creates an ErrorUnprocessableEntity with custom message and cause', () => {
      const cause = { original: 'Bad data' };
      const error = new ErrorUnprocessableEntity(
        validationErrors,
        'Validation Failed',
        cause
      );
      expect(error.code).toBe(422);
      expect(error.message).toBe('Validation Failed');
      expect(error.validationErrors).toBe(validationErrors);
      expect(error.cause).toBe(cause);
    });
  });

  describe('parseError', () => {
    it('parses a DomainError correctly', () => {
      const cause = { reason: 'invalid state' };
      const domainError = new DomainError(
        'DOMAIN_ISSUE',
        'Domain issue occurred',
        cause
      );
      const parsed = parseError(domainError);

      expect(parsed).toEqual({
        type: 'domain',
        name: 'DomainError',
        errorKey: 'DOMAIN_ISSUE',
        message: 'Domain issue occurred',
        cause: cause,
      });
    });

    it('parses an ApiError correctly', () => {
      const cause = { detail: 'issue' };
      const apiError = new ApiError(500, 'Server crashed', cause);
      const parsed = parseError(apiError);

      expect(parsed).toEqual({
        type: 'api',
        name: 'ApiError',
        message: 'Server crashed',
        cause: cause,
        code: 500,
      });
    });

    it('parses an AppError correctly', () => {
      const cause = { detail: 'some cause' };
      const appError = new AppError('App crashed', cause);
      const parsed = parseError(appError);

      expect(parsed).toEqual({
        type: 'domain',
        name: 'AppError',
        message: 'App crashed',
        cause: cause,
      });
    });

    it('parses an unknown error correctly if it is not an AppError or ApiError', () => {
      const genericError = new Error('Standard error');
      const parsed = parseError(genericError);

      expect(parsed).toEqual({
        type: 'unknown',
        name: 'Error',
        message: 'Standard error',
        cause: genericError,
      });

      const stringError = 'String error';
      const parsedString = parseError(stringError);

      expect(parsedString).toEqual({
        type: 'unknown',
        name: 'Error',
        message: 'Unknown error',
        cause: stringError,
      });
    });
  });
});
