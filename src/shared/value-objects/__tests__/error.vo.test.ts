import {
  AppError,
  ApiError,
  ErrorBadRequest,
  ErrorUnauthorized,
  ErrorPaymentRequired,
  ErrorForbidden,
  ErrorResourceNotFound,
  ErrorConflict,
  ErrorUnprocessableEntity,
  ErrorInternalServerError,
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
});
