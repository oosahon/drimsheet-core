import { Request, Response } from 'express';
import { ValidateError } from 'tsoa';

import mockLogger from '@shared/contracts/__mocks__/logger.mock';
import mockReporter from '@shared/contracts/__mocks__/reporter.mock';
import appError from '@shared/values/errors/app.error';
import DomainError from '@shared/values/errors/domain.error';
import runtimeError from '@shared/values/errors/runtime.error';

import accountingAppError from '@app/accounting/errors/accounting.error';
import authError from '@app/auth/errors/auth.error';

import makeHttpErrorHandler from '@interface/http/handlers/error.handler';

interface IBufferedFile {
  buffer?: Buffer;
}

type TSanitizableRequest = Omit<Partial<Request>, 'body' | 'file' | 'files'> & {
  body: {
    other: string;
    password?: string;
  };
  file: IBufferedFile;
  files: IBufferedFile[];
};

describe('makeHttpErrorHandler', () => {
  let mockReq: TSanitizableRequest;
  let mockRes: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  beforeEach(() => {
    mockStatus = jest.fn().mockReturnThis();
    mockJson = jest.fn().mockReturnThis();

    mockReq = {
      headers: {
        authorization: 'Bearer token',
      },
      file: {
        buffer: Buffer.from('test'),
      },
      body: {
        password: 'secretpassword',
        other: 'data',
      },
      files: [
        { buffer: Buffer.from('test1') },
        { buffer: Buffer.from('test2') },
      ],
    };

    mockRes = {
      status: mockStatus,
      json: mockJson,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should clean sensitive data from request', () => {
    const handler = makeHttpErrorHandler({
      reporter: mockReporter,
      logger: mockLogger,
      nodeEnv: 'local',
    });
    const error = new Error('Unknown error');

    handler(mockReq as unknown as Request, mockRes as Response, error);

    expect(mockReq.headers?.authorization).toBeUndefined();
    expect(mockReq.file?.buffer).toBeUndefined();
    expect(mockReq.body?.password).toBeUndefined();
    expect(mockReq.files?.[0].buffer).toBeUndefined();
    expect(mockReq.files?.[1].buffer).toBeUndefined();
  });

  it('should handle tsoa ValidateError', () => {
    const handler = makeHttpErrorHandler({
      reporter: mockReporter,
      logger: mockLogger,
      nodeEnv: 'local',
    });
    const error = new ValidateError(
      {
        email: { message: 'auth_error_email_invalid' },
      },
      'Validation failed'
    );

    handler(mockReq as unknown as Request, mockRes as Response, error);

    expect(mockStatus).toHaveBeenCalledWith(422);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'UnprocessableEntity',
      cause: undefined,
      errorKey: 'app_error_validation_error',
      validationErrors: [
        { field: 'email', message: 'auth_error_email_invalid' },
      ],
    });
    expect(mockLogger.error).toHaveBeenCalledWith(
      'http.request.validation_failed',
      { error, outcome: 'rejected' }
    );
    expect(mockReporter.report).not.toHaveBeenCalled();
  });

  it('should handle tsoa ValidateError without logging outside local', () => {
    const handler = makeHttpErrorHandler({
      reporter: mockReporter,
      logger: mockLogger,
      nodeEnv: 'test',
    });
    const error = new ValidateError(
      {
        email: { message: 'Invalid email' },
      },
      'Validation failed'
    );

    handler(mockReq as unknown as Request, mockRes as Response, error);

    expect(mockStatus).toHaveBeenCalledWith(422);
    expect(mockLogger.error).not.toHaveBeenCalled();
    expect(mockReporter.report).not.toHaveBeenCalled();
  });

  it('should handle AppError (e.g. appError.BadRequest)', () => {
    const handler = makeHttpErrorHandler({
      reporter: mockReporter,
      logger: mockLogger,
      nodeEnv: 'local',
    });
    const error = new appError.BadRequest();

    handler(mockReq as unknown as Request, mockRes as Response, error);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'BadRequest',
      errorKey: 'app_error_request_invalid',
      cause: undefined,
    });
    expect(mockLogger.error).toHaveBeenCalledWith('http.request.rejected', {
      error,
      outcome: 'rejected',
    });
    expect(mockReporter.report).not.toHaveBeenCalled();
  });

  it('maps an absent active accounting entity to 404', () => {
    const handler = makeHttpErrorHandler({
      reporter: mockReporter,
      logger: mockLogger,
      nodeEnv: 'test',
    });

    handler(
      mockReq as unknown as Request,
      mockRes as Response,
      new accountingAppError.ActiveEntityNotFound()
    );

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'AccountingAppError',
      errorKey: 'app_error_accounting_active_entity_not_found',
      cause: undefined,
    });
  });

  it.each([
    [
      'unauthorized',
      () => new appError.Unauthorized(),
      401,
      'app_error_unauthorized',
    ],
    [
      'payment required',
      () => new appError.PaymentRequired(),
      402,
      'app_error_payment_required',
    ],
    ['forbidden', () => new appError.Forbidden(), 403, 'app_error_forbidden'],
    ['conflict', () => new appError.Conflict(), 409, 'app_error_conflict'],
    [
      'too many requests',
      () => new appError.TooManyRequests(),
      429,
      'app_error_too_many_requests',
    ],
  ] as const)(
    'maps the %s suffix without reporting it',
    (_, makeError, status, key) => {
      const handler = makeHttpErrorHandler({
        reporter: mockReporter,
        logger: mockLogger,
        nodeEnv: 'test',
      });
      const error = makeError();

      handler(mockReq as unknown as Request, mockRes as Response, error);

      expect(mockStatus).toHaveBeenCalledWith(status);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ errorKey: key })
      );
      expect(mockReporter.report).not.toHaveBeenCalled();
    }
  );

  it('should handle AppError without logging outside local', () => {
    const handler = makeHttpErrorHandler({
      reporter: mockReporter,
      logger: mockLogger,
      nodeEnv: 'test',
    });
    const error = new appError.BadRequest();

    handler(mockReq as unknown as Request, mockRes as Response, error);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockLogger.error).not.toHaveBeenCalled();
    expect(mockReporter.report).not.toHaveBeenCalled();
  });

  it('should handle domain AppError', () => {
    const handler = makeHttpErrorHandler({
      reporter: mockReporter,
      logger: mockLogger,
      nodeEnv: 'local',
    });
    const error = new appError.Base('app_error_domain_rule_invalid');

    handler(mockReq as unknown as Request, mockRes as Response, error);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'AppError',
      errorKey: 'app_error_domain_rule_invalid',
      cause: undefined,
    });
    expect(mockReporter.report).not.toHaveBeenCalled();
  });

  it('uses the suffix instead of an AuthError name', () => {
    const handler = makeHttpErrorHandler({
      reporter: mockReporter,
      logger: mockLogger,
      nodeEnv: 'local',
    });
    class MockAuthError extends DomainError<'auth_error_test_invalid'> {
      constructor() {
        super('auth_error_test_invalid');
        this.name = 'AuthError';
      }
    }
    const error = new MockAuthError();

    handler(mockReq as unknown as Request, mockRes as Response, error);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'AuthError',
      errorKey: 'auth_error_test_invalid',
      cause: undefined,
    });
    expect(mockReporter.report).not.toHaveBeenCalled();
  });

  it('reports and sanitizes auth errors marked as unexpected', () => {
    const handler = makeHttpErrorHandler({
      reporter: mockReporter,
      logger: mockLogger,
      nodeEnv: 'local',
    });
    const error = new authError.InconsistentUserAuth({
      userId: 'user-id',
    });

    handler(mockReq as unknown as Request, mockRes as Response, error);

    expect(mockReporter.report).toHaveBeenCalledWith(
      'http.request.failed',
      error
    );
    expect(mockLogger.error).not.toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'InternalServerError',
      errorKey: 'app_error_unexpected',
      cause: undefined,
    });
  });

  it('maps a non-auth DomainError by its terminal suffix', () => {
    const handler = makeHttpErrorHandler({
      reporter: mockReporter,
      logger: mockLogger,
      nodeEnv: 'local',
    });
    class MockDomainError extends DomainError<'app_error_other_test_invalid'> {
      constructor() {
        super('app_error_other_test_invalid');
      }
    }
    const error = new MockDomainError();

    handler(mockReq as unknown as Request, mockRes as Response, error);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'MockDomainError',
      errorKey: 'app_error_other_test_invalid',
      cause: undefined,
    });
    expect(mockReporter.report).not.toHaveBeenCalled();
  });

  it('should handle unknown errors and report them', () => {
    const handler = makeHttpErrorHandler({
      reporter: mockReporter,
      logger: mockLogger,
      nodeEnv: 'local',
    });
    const error = new Error('Internal Server Error');

    handler(mockReq as unknown as Request, mockRes as Response, error);

    expect(mockReporter.report).toHaveBeenCalledWith(
      'http.request.failed',
      error
    );
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'InternalServerError',
      errorKey: 'app_error_unexpected',
      cause: undefined,
    });
  });

  it('reports runtime context faults without exposing their key or cause', () => {
    const handler = makeHttpErrorHandler({
      reporter: mockReporter,
      logger: mockLogger,
      nodeEnv: 'test',
    });
    const error = new runtimeError.ContextNotFound({
      requiredKeys: ['user'],
      missingKeys: ['user'],
      correlationId: 'correlation-id',
    });

    handler(mockReq as unknown as Request, mockRes as Response, error);

    expect(mockReporter.report).toHaveBeenCalledWith(
      'http.request.failed',
      error
    );
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'InternalServerError',
      errorKey: 'app_error_unexpected',
      cause: undefined,
    });
  });

  it('reports and sanitizes an error with no errorKey', () => {
    const handler = makeHttpErrorHandler({
      reporter: mockReporter,
      logger: mockLogger,
      nodeEnv: 'local',
    });
    class MockNoKeyError extends Error {}
    const error = new MockNoKeyError();

    handler(mockReq as unknown as Request, mockRes as Response, error);

    expect(mockReporter.report).toHaveBeenCalledWith(
      'http.request.failed',
      error
    );
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'InternalServerError',
      errorKey: 'app_error_unexpected',
      cause: undefined,
    });
  });

  it('reports and sanitizes a custom-named third-party error', () => {
    const handler = makeHttpErrorHandler({
      reporter: mockReporter,
      logger: mockLogger,
      nodeEnv: 'test',
    });
    const error = new Error('Dependency failure');
    error.name = 'DependencyError';

    handler(mockReq as unknown as Request, mockRes as Response, error);

    expect(mockReporter.report).toHaveBeenCalledWith(
      'http.request.failed',
      error
    );
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'InternalServerError',
      errorKey: 'app_error_unexpected',
      cause: undefined,
    });
  });

  it('reports and sanitizes an error with a malformed key', () => {
    const handler = makeHttpErrorHandler({
      reporter: mockReporter,
      logger: mockLogger,
      nodeEnv: 'test',
    });
    const error = {
      name: 'MalformedKeyError',
      errorKey: 'vendor_error_dependency_failed',
      cause: { secret: 'must not leak' },
    };

    handler(mockReq as unknown as Request, mockRes as Response, error);

    expect(mockReporter.report).toHaveBeenCalledWith(
      'http.request.failed',
      error
    );
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'InternalServerError',
      errorKey: 'app_error_unexpected',
      cause: undefined,
    });
  });
});
