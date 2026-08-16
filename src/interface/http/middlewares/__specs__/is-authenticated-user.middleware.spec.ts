import appError from '@shared/values/errors/app.error';

import httpHandlers from '@interface/http/handlers';
import makeIsAuthenticatedUserMiddleware from '@interface/http/middlewares/is-authenticated-user.middleware';

jest.mock('../../handlers', () => ({
  error: jest.fn(),
}));

describe('makeIsAuthenticatedUserMiddleware', () => {
  let mockAppContext: any;
  let mockAccountingEntityService: any;
  let middleware: ReturnType<typeof makeIsAuthenticatedUserMiddleware>;
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppContext = {
      get: jest.fn(),
    };
    mockAccountingEntityService = {
      grantUserAccess: jest.fn(),
    };
    req = {};
    res = {};
    next = jest.fn();
    middleware = makeIsAuthenticatedUserMiddleware(
      mockAppContext,
      mockAccountingEntityService
    );
  });

  it('calls next() when user is logged in and no accounting entity is set', async () => {
    mockAppContext.get.mockReturnValue({
      user: { id: 'user-id' },
    });

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(httpHandlers.error).not.toHaveBeenCalled();
    expect(mockAppContext.get).toHaveBeenCalledWith();
  });

  it('calls next() when user has access to the accounting entity', async () => {
    mockAppContext.get.mockReturnValue({
      user: { id: 'user-id' },
      accountingEntity: { id: 'entity-id' },
    });
    mockAccountingEntityService.grantUserAccess.mockReturnValue(true);

    await middleware(req, res, next);

    expect(mockAccountingEntityService.grantUserAccess).toHaveBeenCalledWith(
      { id: 'entity-id' },
      'user-id'
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(httpHandlers.error).not.toHaveBeenCalled();
  });

  it('handles Unauthorized error when user is not logged in', async () => {
    mockAppContext.get.mockReturnValue({});

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(httpHandlers.error).toHaveBeenCalledWith(
      req,
      res,
      expect.any(appError.Unauthorized)
    );
  });

  it('handles Forbidden error when user does not have access to the accounting entity', async () => {
    mockAppContext.get.mockReturnValue({
      user: { id: 'user-id' },
      accountingEntity: { id: 'entity-id' },
    });
    mockAccountingEntityService.grantUserAccess.mockReturnValue(false);

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(httpHandlers.error).toHaveBeenCalledWith(
      req,
      res,
      expect.any(appError.Forbidden)
    );
  });

  it('handles other errors thrown within the middleware block', async () => {
    const error = new Error('Context failure');
    mockAppContext.get.mockImplementation(() => {
      throw error;
    });

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(httpHandlers.error).toHaveBeenCalledWith(req, res, error);
  });
});
