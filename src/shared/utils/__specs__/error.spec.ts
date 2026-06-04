import appError from '../../../app/shared/errors/app.error';
import DomainError from '../../errors/domain.error';
import errorUtils from '../error';

describe('Error Value Objects', () => {
  describe('AppError', () => {
    it('creates an AppError without cause', () => {
      const error = new appError.Base('app_error_test');
      expect(error).toBeInstanceOf(appError.Base);
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(Error);
      expect(error.errorKey).toBe('app_error_test');
      expect(error.cause).toBeUndefined();
    });

    it('creates an AppError with cause', () => {
      const cause = { detail: 'Something went wrong' };
      const error = new appError.Base('app_error_test', cause);
      expect(error.errorKey).toBe('app_error_test');
      expect(error.cause).toBe(cause);
    });
  });

  describe('DomainError', () => {
    it('creates a DomainError with errorKey and cause', () => {
      const cause = { detail: 'Domain specific issue' };
      const error = new DomainError('TEST_ERROR', cause);
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DomainError');
      expect(error.errorKey).toBe('TEST_ERROR');
      expect(error.cause).toBe(cause);
    });

    it('creates a DomainError without cause', () => {
      const error = new DomainError('TEST_ERROR');
      expect(error.errorKey).toBe('TEST_ERROR');
      expect(error.cause).toBeUndefined();
    });
  });

  describe('errorUtils.parseError', () => {
    it('parses a DomainError correctly', () => {
      const cause = { reason: 'invalid state' };
      const domainError = new DomainError('DOMAIN_ISSUE', cause);
      const parsed = errorUtils.parseError(domainError);

      expect(parsed).toEqual({
        name: 'DomainError',
        errorKey: 'DOMAIN_ISSUE',
        cause: cause,
        _raw: domainError,
      });
    });

    it('parses an AppError correctly', () => {
      const cause = { detail: 'some cause' };
      const testError = new appError.Base('app_error_crashed', cause);
      const parsed = errorUtils.parseError(testError);

      expect(parsed).toEqual({
        name: 'AppError',
        errorKey: 'app_error_crashed',
        cause: cause,
        _raw: testError,
      });
    });

    it('parses an unknown error correctly if it is not a DomainError', () => {
      const genericError = new Error('Standard error');
      const parsed = errorUtils.parseError(genericError);

      expect(parsed).toEqual({
        name: 'Error',
        errorKey: undefined,
        cause: undefined,
        _raw: genericError,
      });

      const stringError = 'String error';
      const parsedString = errorUtils.parseError(stringError);

      expect(parsedString).toEqual({
        name: 'UnknownError',
        errorKey: undefined,
        cause: undefined,
        _raw: stringError,
      });
    });
  });
});
