import { NextFunction, Request, Response } from 'express';

import IVarsConfig from '@shared/contracts/vars-config.contract';
import { TEntityId } from '@shared/types/uuid';
import stringUtils from '@shared/utils/string';
import generateUUID from '@shared/utils/uuid-generator';

import mockAppContext from '@app/context/contracts/__mocks__/app-context.mock';

import makeAppContextInitMiddleware from '@interface/http/middlewares/app-context-init.middleware';

jest.mock('../../../../shared/utils/uuid-generator');

describe('makeAppContextInitMiddleware', () => {
  const validCorrelationId = '0198ad49-0f4a-7709-a5bf-2f7cfbaea7c4';
  const generatedCorrelationId = '5b93d2c6-62f0-4f0f-8ef8-f81cb405b508';

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
    jest
      .mocked(generateUUID)
      .mockReturnValue(generatedCorrelationId as TEntityId);

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
      'x-correlation-id': validCorrelationId,
      'x-idempotency-key': 'existing-idempotency-key',
    };

    const middleware = makeAppContextInitMiddleware(
      mockAppContext,
      mockVarsConfig
    );

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'x-correlation-id',
      validCorrelationId
    );
    expect(mockAppContext.init).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: validCorrelationId,
        idempotencyKey: 'existing-idempotency-key',
      }),
      mockNext
    );
    expect(mockAppContext.init.mock.calls[0][0]).not.toHaveProperty('user');
    expect(mockAppContext.init.mock.calls[0][0]).not.toHaveProperty(
      'accountingEntity'
    );
    expect(generateUUID).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('generates one correlation value and returns it in the response', () => {
    const middleware = makeAppContextInitMiddleware(
      mockAppContext,
      mockVarsConfig
    );

    middleware(mockReq as Request, mockRes as Response, mockNext);

    const initialContext = mockAppContext.init.mock.calls[0][0];

    expect(initialContext.correlationId).toBe(generatedCorrelationId);
    expect(stringUtils.isUUID(initialContext.correlationId)).toBe(true);
    expect(initialContext.idempotencyKey).toBe('');
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'x-correlation-id',
      initialContext.correlationId
    );
    expect(generateUUID).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it.each([
    { description: 'a malformed value', suppliedValue: 'not-a-uuid' },
    { description: 'an oversized value', suppliedValue: 'x'.repeat(1024) },
    {
      description: 'an email-like value',
      suppliedValue: 'private.person@example.com',
    },
    {
      description: 'a token-like value',
      suppliedValue: 'Bearer secret_token_abc123',
    },
  ])('replaces $description with one generated UUID', ({ suppliedValue }) => {
    mockReq.headers = { 'x-correlation-id': suppliedValue };

    const middleware = makeAppContextInitMiddleware(
      mockAppContext,
      mockVarsConfig
    );

    middleware(mockReq as Request, mockRes as Response, mockNext);

    const initialContext = mockAppContext.init.mock.calls[0][0];

    expect(initialContext.correlationId).toBe(generatedCorrelationId);
    expect(stringUtils.isUUID(initialContext.correlationId)).toBe(true);
    expect(JSON.stringify(initialContext)).not.toContain(suppliedValue);
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'x-correlation-id',
      generatedCorrelationId
    );
    expect(mockRes.setHeader).not.toHaveBeenCalledWith(
      'x-correlation-id',
      suppliedValue
    );
    expect(generateUUID).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
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
