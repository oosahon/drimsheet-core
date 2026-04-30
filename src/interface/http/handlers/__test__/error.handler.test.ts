import { Request, Response } from 'express';
import { ValidateError } from 'tsoa';
import mockReporter from '../../../../infra/observability/__mocks__/reporter.mock';
import { AppError, ErrorBadRequest } from '../../../../shared/errors/error';
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
      validationErrors: [
        { field: 'email', message: 'Invalid email' },
        { field: 'age', message: 'Must be a number' },
      ],
    });
    expect(mockReporter.report).not.toHaveBeenCalled();
  });

  it('should handle ApiError (e.g. ErrorBadRequest)', () => {
    const handler = makeHttpErrorHandler(mockReporter);
    const error = new ErrorBadRequest('Bad request occurred');

    handler(mockReq as Request, mockRes as Response, error);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      name: 'ApiError',
      message: 'Bad request occurred',
      cause: undefined,
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
      message: 'Domain rule violated',
      cause: undefined,
    });
    expect(mockReporter.report).not.toHaveBeenCalled();
  });

  it('should handle unknown errors and report them', () => {
    const handler = makeHttpErrorHandler(mockReporter);
    const error = new Error('Database connection failed');

    handler(mockReq as Request, mockRes as Response, error);

    expect(mockReporter.report).toHaveBeenCalledWith(error);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'Database connection failed',
    });
  });
});
