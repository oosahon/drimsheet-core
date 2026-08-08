import httpHandlers from '@interface/http/handlers';
import makeIsOptionalAuthenticatedUserMiddleware from '@interface/http/middlewares/is-optional-authenticated-user.middleware';

jest.mock('../../handlers', () => ({
  error: jest.fn(),
}));

describe('makeIsOptionalAuthenticatedUserMiddleware', () => {
  let middleware: ReturnType<typeof makeIsOptionalAuthenticatedUserMiddleware>;
  let req: any;
  let res: any;
  let next: any;
  let logger: any;
  let reporter: any;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = {};
    next = jest.fn();
    logger = {};
    reporter = {};
    middleware = makeIsOptionalAuthenticatedUserMiddleware(logger, reporter);
  });

  it('calls next() successfully', async () => {
    await middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(httpHandlers.error).not.toHaveBeenCalled();
  });

  it('handles error using httpHandlers.error when next() throws', async () => {
    const error = new Error('Test error');
    next.mockImplementation(() => {
      throw error;
    });

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(httpHandlers.error).toHaveBeenCalledWith(req, res, error);
  });
});
