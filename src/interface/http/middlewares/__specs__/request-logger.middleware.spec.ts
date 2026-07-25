import IAppContext from '../../../../app/_internal/contracts/app-context.contract';
import ILogger from '../../../../shared/contracts/logger.contract';
import IReporter from '../../../../shared/contracts/reporter.contract';
import makeRequestLoggerMiddleware from '../request-logger.middleware';

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
});
