import {
  EErrorKeyStatusSuffix,
  UErrorKeyStatusSuffix,
} from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import appError from '@shared/values/errors/app.error';
import DomainError from '@shared/values/errors/domain.error';

describe('Error Value Objects', () => {
  describe('AppError', () => {
    it('creates a branded AppError with or without a cause', () => {
      const cause = { detail: 'Something went wrong' };
      const error = new appError.Base('app_error_test_invalid', cause);
      const errorWithoutCause = new appError.Base('app_error_test_invalid');

      expect(error).toBeInstanceOf(appError.Base);
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(Error);
      expect(error.errorKey).toBe('app_error_test_invalid');
      expect(error.cause).toBe(cause);
      expect(errorWithoutCause.cause).toBeUndefined();
    });
  });

  describe('DomainError', () => {
    it('creates a branded DomainError with or without a cause', () => {
      const cause = { detail: 'Domain specific issue' };
      const error = new DomainError('test_error_domain_invalid', cause);
      const errorWithoutCause = new DomainError('test_error_domain_invalid');

      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DomainError');
      expect(error.errorKey).toBe('test_error_domain_invalid');
      expect(error.cause).toBe(cause);
      expect(errorWithoutCause.cause).toBeUndefined();
    });
  });

  describe('errorUtils.getErrorKeyStatusSuffix', () => {
    it.each(
      Object.values(EErrorKeyStatusSuffix).map((suffix) => [
        `test_error_${suffix}`,
        suffix,
      ])
    )('recognizes %s', (errorKey, suffix) => {
      expect(errorUtils.getErrorKeyStatusSuffix(errorKey)).toBe(
        suffix as UErrorKeyStatusSuffix
      );
    });

    it.each([
      null,
      undefined,
      42,
      'invalid',
      '_invalid',
      'test-error-invalid',
      'test_error_internal_server_error',
      'test_error_unavailable',
    ])('rejects malformed or unsupported value %p', (value) => {
      expect(errorUtils.getErrorKeyStatusSuffix(value)).toBeUndefined();
    });
  });

  describe('errorUtils.parseError', () => {
    it('parses a branded DomainError without losing its diagnostics', () => {
      const cause = { reason: 'invalid state' };
      const domainError = new DomainError('test_error_domain_invalid', cause);

      expect(errorUtils.parseError(domainError)).toEqual({
        name: 'DomainError',
        errorKey: 'test_error_domain_invalid',
        errorKeyStatusSuffix: EErrorKeyStatusSuffix.Invalid,
        cause,
        validationErrors: undefined,
        _raw: domainError,
      });
    });

    it('preserves recognized validation errors', () => {
      const validationErrors = [
        { field: 'email', message: 'auth_error_email_invalid' },
      ];
      const error = new appError.UnprocessableEntity(validationErrors);

      expect(errorUtils.parseError(error)).toMatchObject({
        errorKey: 'app_error_validation_error',
        errorKeyStatusSuffix: EErrorKeyStatusSuffix.ValidationError,
        validationErrors,
      });
    });

    it.each([null, undefined, 'String error', 42, true])(
      'safely parses primitive value %p',
      (value) => {
        expect(errorUtils.parseError(value)).toEqual({
          name: 'UnknownError',
          errorKey: undefined,
          errorKeyStatusSuffix: undefined,
          cause: undefined,
          validationErrors: undefined,
          _raw: value,
        });
      }
    );

    it('does not infer a key from a native error', () => {
      const error = new Error('Standard error');

      expect(errorUtils.parseError(error)).toMatchObject({
        name: 'Error',
        errorKey: undefined,
        errorKeyStatusSuffix: undefined,
        _raw: error,
      });
    });

    it('does not trust a custom-named third-party error without a key', () => {
      const error = new Error('Third-party failure');
      error.name = 'VendorFailure';

      expect(errorUtils.parseError(error)).toMatchObject({
        name: 'VendorFailure',
        errorKey: undefined,
        errorKeyStatusSuffix: undefined,
        _raw: error,
      });
    });

    it('distinguishes a missing key from a recognized branded key', () => {
      const error = { name: 'MissingKeyError', cause: { operation: 'read' } };

      expect(errorUtils.parseError(error)).toMatchObject({
        name: 'MissingKeyError',
        errorKey: undefined,
        errorKeyStatusSuffix: undefined,
        cause: { operation: 'read' },
      });
    });

    it('rejects an unsupported key without exposing it as branded', () => {
      const error = {
        name: 'MalformedKeyError',
        errorKey: 'vendor_error_dependency_failed',
      };

      expect(errorUtils.parseError(error)).toMatchObject({
        name: 'MalformedKeyError',
        errorKey: undefined,
        errorKeyStatusSuffix: undefined,
        _raw: error,
      });
    });
  });
});
