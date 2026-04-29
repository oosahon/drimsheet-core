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
  IApiValidationError,
  parseError,
} from '../error';

describe('Error classes', () => {
  const cause = { detail: 'some detail' };

  describe('AppError', () => {
    it('creates an instance of AppError', () => {
      const error = new AppError('App error', cause);
      expect(error.message).toBe('App error');
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('AppError');
    });
  });

  describe('DomainError', () => {
    it('creates an instance of DomainError', () => {
      const error = new DomainError('SOME_KEY', 'Domain error', cause);
      expect(error.message).toBe('Domain error');
      expect(error.errorKey).toBe('SOME_KEY');
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('DomainError');
    });
  });

  describe('ApiError', () => {
    it('creates an instance of ApiError', () => {
      const error = new ApiError(501, 'Api error', cause);
      expect(error.message).toBe('Api error');
      expect(error.code).toBe(501);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('ApiError');
    });
  });

  describe('Specific ApiErrors', () => {
    it('creates ErrorBadRequest', () => {
      const error = new ErrorBadRequest('Bad Request', cause);
      expect(error.code).toBe(400);
      expect(error.message).toBe('Bad Request');
    });

    it('creates ErrorUnauthorized with default message', () => {
      const error = new ErrorUnauthorized();
      expect(error.code).toBe(401);
      expect(error.message).toBe('Unauthorized');
    });

    it('creates ErrorUnauthorized with custom message', () => {
      const error = new ErrorUnauthorized('Custom unauthorized', cause);
      expect(error.message).toBe('Custom unauthorized');
      expect(error.cause).toBe(cause);
    });

    it('creates ErrorPaymentRequired', () => {
      const error = new ErrorPaymentRequired('Payment Required', cause);
      expect(error.code).toBe(402);
      expect(error.message).toBe('Payment Required');
    });

    it('creates ErrorForbidden with default message', () => {
      const error = new ErrorForbidden();
      expect(error.code).toBe(403);
      expect(error.message).toBe('Forbidden');
    });

    it('creates ErrorForbidden with custom message', () => {
      const error = new ErrorForbidden('Custom forbidden', cause);
      expect(error.message).toBe('Custom forbidden');
    });

    it('creates ErrorResourceNotFound', () => {
      const error = new ErrorResourceNotFound('Not Found', cause);
      expect(error.code).toBe(404);
      expect(error.message).toBe('Not Found');
    });

    it('creates ErrorConflict', () => {
      const error = new ErrorConflict('Conflict', cause);
      expect(error.code).toBe(409);
      expect(error.message).toBe('Conflict');
    });

    it('creates ErrorUnprocessableEntity with default message', () => {
      const validationErrors: IApiValidationError[] = [
        { field: 'name', message: 'Required' },
      ];
      const error = new ErrorUnprocessableEntity(validationErrors);
      expect(error.code).toBe(422);
      expect(error.message).toBe('Unprocessable Entity');
      expect(error.validationErrors).toBe(validationErrors);
    });

    it('creates ErrorUnprocessableEntity with custom message', () => {
      const validationErrors: IApiValidationError[] = [];
      const error = new ErrorUnprocessableEntity(
        validationErrors,
        'Custom unprocessable',
        cause
      );
      expect(error.message).toBe('Custom unprocessable');
      expect(error.cause).toBe(cause);
    });

    it('creates ErrorTooManyRequests', () => {
      const error = new ErrorTooManyRequests('Too Many', cause);
      expect(error.code).toBe(429);
      expect(error.message).toBe('Too Many');
    });

    it('creates ErrorInternalServerError', () => {
      const error = new ErrorInternalServerError(
        'Internal Server Error',
        cause
      );
      expect(error.code).toBe(500);
      expect(error.message).toBe('Internal Server Error');
    });
  });

  describe('parseError', () => {
    it('parses ApiError correctly', () => {
      const error = new ErrorBadRequest('Api issue', cause);
      const parsed = parseError(error);
      expect(parsed).toEqual({
        type: 'api',
        name: 'ApiError',
        message: 'Api issue',
        cause,
        code: 400,
      });
    });

    it('parses DomainError correctly', () => {
      const error = new DomainError('TEST_KEY', 'Domain issue', cause);
      const parsed = parseError(error);
      expect(parsed).toEqual({
        type: 'domain',
        name: 'DomainError',
        errorKey: 'TEST_KEY',
        message: 'Domain issue',
        cause,
      });
    });

    it('parses AppError correctly', () => {
      const error = new AppError('App issue', cause);
      const parsed = parseError(error);
      expect(parsed).toEqual({
        type: 'domain',
        name: 'AppError',
        message: 'App issue',
        cause,
      });
    });

    it('parses unknown generic Error correctly', () => {
      const error = new Error('Standard error');
      const parsed = parseError(error);
      expect(parsed).toEqual({
        type: 'unknown',
        name: 'Error',
        message: 'Standard error',
        cause: error,
      });
    });

    it('parses completely unknown types (strings, null, undefined) correctly', () => {
      const parsedString = parseError('Just a string');
      expect(parsedString.name).toBe('Error');
      expect(parsedString.message).toBe('Unknown error');
      expect(parsedString.cause).toBe('Just a string');

      const parsedNull = parseError(null);
      expect(parsedNull.cause).toBeNull();
    });
  });
});
