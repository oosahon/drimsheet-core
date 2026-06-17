import { Request, Response } from 'express';
import IAuthService from '../../../../app/auth/contracts/auth-service.contract';
import IRequestContext from '../../../../app/shared/contracts/request-context.contract';
import IAccountingEntityRepo from '../../../../domain/accounting/repos/accounting-entity.repo';
import { IAccountingEntity } from '../../../../domain/accounting/types/accounting-entity.types';
import IUserRepo from '../../../../domain/user/repos/user.repo';
import { IUser } from '../../../../domain/user/types/user.types';
import ILogger from '../../../../shared/contracts/logger.contract';
import makeRequestContextInitMiddleware from '../request-context-init.middleware';

let mockWebAppUrl = 'http://localhost:3000';
let mockNodeEnv = 'test';

jest.mock('../../../../infra/config/vars.config', () => ({
  get NODE_ENV() {
    return mockNodeEnv;
  },
  get WEB_APP_URL() {
    return mockWebAppUrl;
  },
}));

describe('makeRequestContextInitMiddleware', () => {
  let mockRequestContext: jest.Mocked<IRequestContext>;
  let mockAccountingEntityRepo: jest.Mocked<IAccountingEntityRepo>;
  let mockAuthService: jest.Mocked<IAuthService>;
  let mockUserRepo: jest.Mocked<IUserRepo>;
  let mockLogger: jest.Mocked<ILogger>;

  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequestContext = {
      init: jest.fn((ctx, next) => next()),
      get: jest.fn(),
    } as unknown as jest.Mocked<IRequestContext>;

    mockAccountingEntityRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IAccountingEntityRepo>;

    mockAuthService = {
      getAuthUser: jest.fn(),
    } as unknown as jest.Mocked<IAuthService>;

    mockUserRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IUserRepo>;

    mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
    } as unknown as jest.Mocked<ILogger>;

    mockReq = {
      headers: {},
      cookies: {},
    };

    mockRes = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    mockNext = jest.fn();

    // Reset mocks between tests
    mockWebAppUrl = 'http://localhost:3000';
    mockNodeEnv = 'test';
    jest.clearAllMocks();
  });

  it('should initialize request context with empty user and entity when no headers are provided', async () => {
    const middleware = makeRequestContextInitMiddleware(
      mockRequestContext,
      mockAccountingEntityRepo,
      mockAuthService,
      mockUserRepo,
      mockLogger
    );

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRequestContext.init).toHaveBeenCalled();
    const initArgs = mockRequestContext.init.mock.calls[0][0];
    expect(initArgs.user).toEqual({});
    expect(initArgs.accountingEntity).toEqual({});
    expect(initArgs.correlationId).toBeDefined();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should authenticate user when authorization header is valid', async () => {
    mockReq.headers = { authorization: 'Bearer valid_token' };
    mockAuthService.getAuthUser.mockResolvedValue({ id: 'user-id-123' } as any);
    mockUserRepo.findById.mockResolvedValue({
      id: 'user-id-123',
      email: 'test@example.com',
    } as IUser);

    const middleware = makeRequestContextInitMiddleware(
      mockRequestContext,
      mockAccountingEntityRepo,
      mockAuthService,
      mockUserRepo,
      mockLogger
    );

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    const initArgs = mockRequestContext.init.mock.calls[0][0];
    expect(initArgs.user).toEqual({
      id: 'user-id-123',
      email: 'test@example.com',
    });
    expect(initArgs.accountingEntity).toEqual({});
    expect(mockNext).toHaveBeenCalled();
  });

  it('should fetch accounting entity and initialize context successfully', async () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';
    mockReq.headers = {
      authorization: 'Bearer valid_token',
      'x-accounting-entity-id': validUUID,
    };
    mockAuthService.getAuthUser.mockResolvedValue({ id: 'user-id-123' } as any);
    mockUserRepo.findById.mockResolvedValue({ id: 'user-id-123' } as IUser);

    mockAccountingEntityRepo.findById.mockResolvedValue({
      id: validUUID,
      ownerId: 'user-id-123', // Matches user id
    } as IAccountingEntity);

    const middleware = makeRequestContextInitMiddleware(
      mockRequestContext,
      mockAccountingEntityRepo,
      mockAuthService,
      mockUserRepo,
      mockLogger
    );

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    const initArgs = mockRequestContext.init.mock.calls[0][0];
    expect(initArgs.user.id).toBe('user-id-123');
    expect(initArgs.accountingEntity.id).toBe(validUUID);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should implement client session methods correctly with undefined domain on localhost', async () => {
    mockWebAppUrl = 'http://localhost:3000'; // local
    const middleware = makeRequestContextInitMiddleware(
      mockRequestContext,
      mockAccountingEntityRepo,
      mockAuthService,
      mockUserRepo,
      mockLogger
    );

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    const initArgs = mockRequestContext.init.mock.calls[0][0];
    const clientSession = initArgs.clientSession;

    expect(clientSession).toBeDefined();

    // Test setRefreshToken
    clientSession.setRefreshToken('new_token');
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'new_token',
      expect.objectContaining({
        httpOnly: true,
        domain: undefined,
        sameSite: 'lax',
      })
    );

    // Test getRefreshToken
    mockReq.cookies = { refresh_token: 'existing_token' };
    const retrievedToken = clientSession.getRefreshToken();
    expect(retrievedToken).toBe('existing_token');

    // Test clearRefreshToken
    clientSession.clearRefreshToken();
    expect(mockRes.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({
        httpOnly: true,
        domain: undefined,
        sameSite: 'lax',
      })
    );
  });

  it('should set cookie domain appropriately when hostname is not localhost', async () => {
    mockWebAppUrl = 'https://production.purpleledger.app'; // production
    mockNodeEnv = 'production';

    const middleware = makeRequestContextInitMiddleware(
      mockRequestContext,
      mockAccountingEntityRepo,
      mockAuthService,
      mockUserRepo,
      mockLogger
    );

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    const initArgs = mockRequestContext.init.mock.calls[0][0];
    const clientSession = initArgs.clientSession;

    // Test setRefreshToken
    clientSession.setRefreshToken('new_token');
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'new_token',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        domain: 'production.purpleledger.app',
        sameSite: 'lax',
      })
    );

    // Test clearRefreshToken
    clientSession.clearRefreshToken();
    expect(mockRes.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        domain: 'production.purpleledger.app',
        sameSite: 'lax',
      })
    );
  });
});
