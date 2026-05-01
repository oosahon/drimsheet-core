import { Request, Response } from 'express';
import { ValidateError } from 'tsoa';
import httpError from '../../../../app/errors/http.errors';
import mockReporter from '../../../../infra/observability/__mocks__/reporter.mock';
import AppError from '../../../../shared/errors/app.error';
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
      cause: undefined,
      errorKey: 'http_error_unprocessable_entity',
      validationErrors: [
        { field: 'email', message: 'Invalid email' },
        { field: 'age', message: 'Must be a number' },
      ],
    });
    expect(mockReporter.report).not.toHaveBeenCalled();
  });

  it('should handle ApiError (e.g. httpError.BadRequest)', () => {
    const handler = makeHttpErrorHandler(mockReporter);
    const error = new httpError.BadRequest();

    handler(mockReq as Request, mockRes as Response, error);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'HttpError',
      errorKey: 'http_error_bad_request',
      message: 'http_error_bad_request',
      cause: null,
    });
    expect(mockReporter.report).not.toHaveBeenCalled();
  });

  it('should handle domain AppError', () => {
    const handler = makeHttpErrorHandler(mockReporter);
    const error = new AppError('Domain rule violated');

    handler(mockReq as Request, mockRes as Response, error);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'AppError',
      errorKey: 'Domain rule violated',
      message: 'Domain rule violated',
      cause: null,
    });
    expect(mockReporter.report).not.toHaveBeenCalled();
  });

  it('should handle auth DomainError and return 401', () => {
    const handler = makeHttpErrorHandler(mockReporter);
    class MockAuthError extends DomainError<'app_error_auth_test'> {
      constructor() {
        super('app_error_auth_test');
      }
    }
    const error = new MockAuthError();

    handler(mockReq as Request, mockRes as Response, error);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'MockAuthError',
      errorKey: 'app_error_auth_test',
      message: 'app_error_auth_test',
      cause: null,
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
      message: 'app_error_other_test',
      cause: null,
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
      message: 'http_error_internal_server_error',
    });
  });
});
