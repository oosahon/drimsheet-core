import { Request, Response } from 'express';
import { ValidateError } from 'tsoa';
import appError from '../../../../app/errors/app.error';
import mockReporter from '../../../../infra/observability/__mocks__/reporter.mock';
import DomainError from '../../../../shared/errors/domain.error';
import makeHttpErrorHandler from '../error.handler';

describe('makeHttpErrorHandler', () => {
  let mockReq: Partial<Request>;
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
      } as any,
      body: {
        password: 'secretpassword',
        other: 'data',
      },
      files: [
        { buffer: Buffer.from('test1') },
        { buffer: Buffer.from('test2') },
      ] as any,
    };

    mockRes = {
      status: mockStatus,
      json: mockJson,
    };

    jest.clearAllMocks();
  });

  it('should clean sensitive data from request', () => {
    const handler = makeHttpErrorHandler(mockReporter);
    const error = new Error('Unknown error');

    handler(mockReq as Request, mockRes as Response, error);

    expect(mockReq.headers?.authorization).toBeUndefined();
    // @ts-ignore
    expect(mockReq.file?.buffer).toBeUndefined();
    expect(mockReq.body?.password).toBeUndefined();
    // @ts-ignore
    expect(mockReq.files?.[0].buffer).toBeUndefined();
    // @ts-ignore
    expect(mockReq.files?.[1].buffer).toBeUndefined();
  });

  it('should handle tsoa ValidateError', () => {
    const handler = makeHttpErrorHandler(mockReporter);
    const error = new ValidateError(
      {
        email: { message: 'Invalid email' },
        age: { message: 'Must be a number' },
      },
      'Validation failed'
    );

    handler(mockReq as Request, mockRes as Response, error);

    expect(mockStatus).toHaveBeenCalledWith(422);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'UnprocessableEntity',
      cause: undefined,
      errorKey: 'app_error_unprocessable',
      validationErrors: [
        { field: 'email', message: 'Invalid email' },
        { field: 'age', message: 'Must be a number' },
      ],
    });
    expect(mockReporter.report).not.toHaveBeenCalled();
  });

  it('should handle AppError (e.g. appError.BadRequest)', () => {
    const handler = makeHttpErrorHandler(mockReporter);
    const error = new appError.BadRequest();

    handler(mockReq as Request, mockRes as Response, error);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'BadRequest',
      errorKey: 'app_error_bad_request',
      cause: undefined,
    });
    expect(mockReporter.report).not.toHaveBeenCalled();
  });

  it('should handle domain AppError', () => {
    const handler = makeHttpErrorHandler(mockReporter);
    const error = new appError.Base('app_error_domain_rule_violated');

    handler(mockReq as Request, mockRes as Response, error);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'AppError',
      errorKey: 'app_error_domain_rule_violated',
      cause: undefined,
    });
    expect(mockReporter.report).not.toHaveBeenCalled();
  });

  it('should handle auth DomainError and return 401', () => {
    const handler = makeHttpErrorHandler(mockReporter);
    class MockAuthError extends DomainError<'auth_error_test'> {
      constructor() {
        super('auth_error_test');
        this.name = 'AuthError';
      }
    }
    const error = new MockAuthError();

    handler(mockReq as Request, mockRes as Response, error);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'AuthError',
      errorKey: 'auth_error_test',
      cause: undefined,
    });
    expect(mockReporter.report).not.toHaveBeenCalled();
  });

  it('should handle non-auth DomainError and return 400', () => {
    const handler = makeHttpErrorHandler(mockReporter);
    class MockDomainError extends DomainError<'app_error_other_test'> {
      constructor() {
        super('app_error_other_test');
      }
    }
    const error = new MockDomainError();

    handler(mockReq as Request, mockRes as Response, error);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'MockDomainError',
      errorKey: 'app_error_other_test',
      cause: undefined,
    });
    expect(mockReporter.report).not.toHaveBeenCalled();
  });

  it('should handle unknown errors and report them', () => {
    const handler = makeHttpErrorHandler(mockReporter);
    const error = new Error('Internal Server Error');

    handler(mockReq as Request, mockRes as Response, error);

    expect(mockReporter.report).toHaveBeenCalledWith(error);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'InternalServerError',
      errorKey: 'app_error_internal_server_error',
      cause: undefined,
    });
  });

  it('should handle domain error with no errorKey and fallback to Unknown error', () => {
    const handler = makeHttpErrorHandler(mockReporter);
    class MockNoKeyError extends DomainError<any> {
      constructor() {
        super('' as any);
      }
    }
    const error = new MockNoKeyError();

    handler(mockReq as Request, mockRes as Response, error);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'MockNoKeyError',
      errorKey: '',
      cause: undefined,
    });
    expect(mockReporter.report).not.toHaveBeenCalled();
  });
});
