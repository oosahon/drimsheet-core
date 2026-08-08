import { performance } from 'perf_hooks';

import ILogger from '@shared/contracts/logger.contract';
import IReporter from '@shared/contracts/reporter.contract';

import IAppContext from '@app/context/contracts/app-context.contract';

import makeRequestLoggerMiddleware from '@interface/http/middlewares/request-logger.middleware';

describe('makeRequestLoggerMiddleware', () => {
  let mockLogger: jest.Mocked<ILogger>;
  let mockReporter: jest.Mocked<IReporter>;
  let mockAppContext: jest.Mocked<IAppContext>;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    mockReporter = {
      report: jest.fn(),
      reportAbuse: jest.fn(),
    };
    mockAppContext = {
      get: jest.fn().mockReturnValue({ correlationId: 'test-corr-id' }),
      init: jest.fn(),
      set: jest.fn(),
    };
  });

  it('logs requests via logger.info when request finishes successfully', () => {
    const middleware = makeRequestLoggerMiddleware(
      mockLogger,
      mockReporter,
      mockAppContext
    );

    const finishCallbacks: Array<() => void> = [];
    const req = {
      method: 'GET',
      originalUrl: '/api/v1/users?token=secret123',
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    } as any;
    const res = {
      statusCode: 200,
      getHeader: jest.fn().mockReturnValue('100'),
      on: jest.fn((event, cb) => {
        if (event === 'finish') finishCallbacks.push(cb);
      }),
    } as any;
    const next = jest.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();

    finishCallbacks.forEach((cb) => cb());

    expect(mockLogger.info).toHaveBeenCalledWith(
      '[200] GET /api/v1/users?token=secret123',
      expect.objectContaining({
        method: 'GET',
        url: '/api/v1/users?token=secret123',
        statusCode: 200,
        correlationId: 'test-corr-id',
      })
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs warnings via logger.warn when client error occurs (statusCode 400)', () => {
    const middleware = makeRequestLoggerMiddleware(
      mockLogger,
      mockReporter,
      mockAppContext
    );

    const finishCallbacks: Array<() => void> = [];
    const req = {
      method: 'POST',
      originalUrl: '/api/v1/users',
      headers: {
        'user-agent': 'test-agent',
        'x-forwarded-for': '203.0.113.195',
      },
    } as any;
    const res = {
      statusCode: 400,
      getHeader: jest.fn().mockReturnValue(undefined),
      on: jest.fn((event, cb) => {
        if (event === 'finish') finishCallbacks.push(cb);
      }),
    } as any;
    const next = jest.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();

    finishCallbacks.forEach((cb) => cb());

    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[400] POST /api/v1/users',
      expect.objectContaining({
        method: 'POST',
        url: '/api/v1/users',
        statusCode: 400,
        ip: '203.0.113.195',
        responseSize: 0,
      })
    );
  });

  it('logs errors via logger.error when server error occurs (statusCode 500)', () => {
    const middleware = makeRequestLoggerMiddleware(
      mockLogger,
      mockReporter,
      mockAppContext
    );

    const finishCallbacks: Array<() => void> = [];
    const req = {
      method: 'DELETE',
      originalUrl: '/api/v1/users/123',
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    } as any;
    const res = {
      statusCode: 500,
      getHeader: jest.fn().mockReturnValue('200'),
      on: jest.fn((event, cb) => {
        if (event === 'finish') finishCallbacks.push(cb);
      }),
    } as any;
    const next = jest.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();

    finishCallbacks.forEach((cb) => cb());

    expect(mockLogger.error).toHaveBeenCalledWith(
      '[500] DELETE /api/v1/users/123',
      expect.objectContaining({
        method: 'DELETE',
        url: '/api/v1/users/123',
        statusCode: 500,
        responseSize: 200,
      })
    );
  });

  it('reports slow requests via reporter and logs warnings', () => {
    const middleware = makeRequestLoggerMiddleware(
      mockLogger,
      mockReporter,
      mockAppContext
    );

    const finishCallbacks: Array<() => void> = [];
    const req = {
      method: 'GET',
      originalUrl: '/api/v1/heavy-query',
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    } as any;
    const res = {
      statusCode: 200,
      getHeader: jest.fn().mockReturnValue('150'),
      on: jest.fn((event, cb) => {
        if (event === 'finish') finishCallbacks.push(cb);
      }),
    } as any;
    const next = jest.fn();

    const nowSpy = jest.spyOn(performance, 'now');
    nowSpy.mockReturnValueOnce(1000).mockReturnValueOnce(2500);

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();

    finishCallbacks.forEach((cb) => cb());

    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[200] GET /api/v1/heavy-query',
      expect.objectContaining({
        method: 'GET',
        url: '/api/v1/heavy-query',
        statusCode: 200,
        duration: '1500ms',
      })
    );

    expect(mockReporter.report).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        method: 'GET',
        url: '/api/v1/heavy-query',
        duration: '1500ms',
      })
    );
  });
});
