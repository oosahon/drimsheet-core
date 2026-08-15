import { NextFunction, Request, Response } from 'express';

import IVarsConfig from '@shared/contracts/vars-config.contract';

import mockAppContext from '@app/context/contracts/__mocks__/app-context.mock';

import makeAppContextInitMiddleware from '@interface/http/middlewares/app-context-init.middleware';

describe('makeAppContextInitMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let mockVarsConfig: IVarsConfig;

  function getInitializedClientSession() {
    const clientSession = mockAppContext.init.mock.calls[0][0].clientSession;

    if (!clientSession) {
      throw new Error('Expected initialized client session');
    }

    return clientSession;
  }

  beforeEach(() => {
    jest.clearAllMocks();

    mockAppContext.init.mockImplementation((_context, next) => next());

    mockReq = {
      headers: {},
      cookies: {},
    };
    mockRes = {
      setHeader: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
    mockNext = jest.fn();
    mockVarsConfig = {
      NODE_ENV: 'test',
    } as IVarsConfig;
  });

  it('initializes context with the supplied correlation and idempotency headers', () => {
    mockReq.headers = {
      'x-correlation-id': 'existing-correlation-id',
      'x-idempotency-key': 'existing-idempotency-key',
    };

    const middleware = makeAppContextInitMiddleware(
      mockAppContext,
      mockVarsConfig
    );

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'x-correlation-id',
      'existing-correlation-id'
    );
    expect(mockAppContext.init).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: 'existing-correlation-id',
        idempotencyKey: 'existing-idempotency-key',
      }),
      mockNext
    );
    expect(mockAppContext.init.mock.calls[0][0]).not.toHaveProperty('user');
    expect(mockAppContext.init.mock.calls[0][0]).not.toHaveProperty(
      'accountingEntity'
    );
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('generates one correlation value and returns it in the response', () => {
    const middleware = makeAppContextInitMiddleware(
      mockAppContext,
      mockVarsConfig
    );

    middleware(mockReq as Request, mockRes as Response, mockNext);

    const initialContext = mockAppContext.init.mock.calls[0][0];

    expect(initialContext.correlationId).toEqual(expect.any(String));
    expect(initialContext.idempotencyKey).toBe('');
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'x-correlation-id',
      initialContext.correlationId
    );
  });

  it('provides client session cookie operations', () => {
    mockReq.cookies = { refresh_token: 'existing-token' };

    const middleware = makeAppContextInitMiddleware(
      mockAppContext,
      mockVarsConfig
    );

    middleware(mockReq as Request, mockRes as Response, mockNext);

    const clientSession = getInitializedClientSession();

    clientSession.setRefreshToken('new-token');
    expect(mockRes.cookie).toHaveBeenCalledWith('refresh_token', 'new-token', {
      httpOnly: true,
      secure: false,
      path: '/api/v1/auth',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 15,
    });

    expect(clientSession.getRefreshToken()).toBe('existing-token');

    clientSession.clearRefreshToken();
    expect(mockRes.clearCookie).toHaveBeenCalledWith('refresh_token', {
      httpOnly: true,
      secure: false,
      path: '/api/v1/auth',
      sameSite: 'lax',
    });
  });

  it('returns null when cookies have not been parsed yet', () => {
    mockReq.cookies = undefined;

    const middleware = makeAppContextInitMiddleware(
      mockAppContext,
      mockVarsConfig
    );

    middleware(mockReq as Request, mockRes as Response, mockNext);

    const clientSession = getInitializedClientSession();

    expect(clientSession.getRefreshToken()).toBeNull();
  });

  it('sets secure refresh cookies in production', () => {
    mockVarsConfig.NODE_ENV = 'production';

    const middleware = makeAppContextInitMiddleware(
      mockAppContext,
      mockVarsConfig
    );

    middleware(mockReq as Request, mockRes as Response, mockNext);

    const clientSession = getInitializedClientSession();

    clientSession.setRefreshToken('new-token');
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'new-token',
      expect.objectContaining({ secure: true })
    );

    clientSession.clearRefreshToken();
    expect(mockRes.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ secure: true })
    );
  });
});
