import { Request, Response } from 'express';
import ITokenService, {
  IAuthTokenPayload,
} from '../../../../app/auth/contracts/token-service.contract';
import IAppContext from '../../../../app/context/contracts/app-context.contract';
import IAccountingEntityRepo from '../../../../domain/accounting/repos/accounting-entity.repo';
import { IAccountingEntity } from '../../../../domain/accounting/types/accounting-entity.types';
import IUserRepo from '../../../../domain/user/repos/user.repo';
import { IUser } from '../../../../domain/user/types/user.types';
import ILogger from '../../../../shared/contracts/logger.contract';
import IVarsConfig from '../../../../shared/contracts/vars-config.contract';
import makeAppContextInitMiddleware from '../app-context-init.middleware';

describe('makeAppContextInitMiddleware', () => {
  let mockAppContext: jest.Mocked<IAppContext>;
  let mockAccountingEntityRepo: jest.Mocked<IAccountingEntityRepo>;
  let mockAuthService: jest.Mocked<ITokenService>;
  let mockUserRepo: jest.Mocked<IUserRepo>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockVarsConfig: Partial<IVarsConfig>;

  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockAppContext = {
      init: jest.fn((ctx, next) => next()),
      get: jest.fn(),
    } as unknown as jest.Mocked<IAppContext>;

    mockAccountingEntityRepo = {
      findByIdAndUserId: jest.fn(),
    } as unknown as jest.Mocked<IAccountingEntityRepo>;

    mockAuthService = {
      getAuthUser: jest.fn(),
    } as unknown as jest.Mocked<ITokenService>;

    mockUserRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IUserRepo>;

    mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
    } as unknown as jest.Mocked<ILogger>;

    mockVarsConfig = {
      WEB_APP_URL: 'http://localhost:3000',
      NODE_ENV: 'test',
    };

    mockReq = {
      headers: {},
      cookies: {},
    };

    mockRes = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  it('should initialize request context with empty user and entity when no headers are provided', async () => {
    const middleware = makeAppContextInitMiddleware(
      mockAppContext,
      mockAccountingEntityRepo,
      mockAuthService,
      mockUserRepo,
      mockLogger,
      mockVarsConfig as IVarsConfig
    );

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockAppContext.init).toHaveBeenCalled();
    const initArgs = mockAppContext.init.mock.calls[0][0];
    expect(initArgs.user).toEqual({});
    expect(initArgs.accountingEntity).toEqual({});
    expect(initArgs.correlationId).toBeDefined();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should authenticate user when authorization header is valid', async () => {
    mockReq.headers = { authorization: 'Bearer valid_token' };
    mockAuthService.getAuthUser.mockResolvedValue({
      id: 'user-id-123',
    } as IAuthTokenPayload);
    mockUserRepo.findById.mockResolvedValue({
      id: 'user-id-123',
      email: 'test@example.com',
    } as IUser);

    const middleware = makeAppContextInitMiddleware(
      mockAppContext,
      mockAccountingEntityRepo,
      mockAuthService,
      mockUserRepo,
      mockLogger,
      mockVarsConfig as IVarsConfig
    );

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    const initArgs = mockAppContext.init.mock.calls[0][0];
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
    mockAuthService.getAuthUser.mockResolvedValue({
      id: 'user-id-123',
    } as IAuthTokenPayload);
    mockUserRepo.findById.mockResolvedValue({ id: 'user-id-123' } as IUser);

    mockAccountingEntityRepo.findByIdAndUserId.mockResolvedValue({
      id: validUUID,
      ownerId: 'user-id-123', // Matches user id
    } as IAccountingEntity);

    const middleware = makeAppContextInitMiddleware(
      mockAppContext,
      mockAccountingEntityRepo,
      mockAuthService,
      mockUserRepo,
      mockLogger,
      mockVarsConfig as IVarsConfig
    );

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    const initArgs = mockAppContext.init.mock.calls[0][0];
    expect(initArgs.user.id).toBe('user-id-123');
    expect(initArgs.accountingEntity.id).toBe(validUUID);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should implement client session methods correctly with undefined domain on localhost', async () => {
    mockVarsConfig.WEB_APP_URL = 'http://localhost:3000'; // local

    const middleware = makeAppContextInitMiddleware(
      mockAppContext,
      mockAccountingEntityRepo,
      mockAuthService,
      mockUserRepo,
      mockLogger,
      mockVarsConfig as IVarsConfig
    );

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    const initArgs = mockAppContext.init.mock.calls[0][0];
    const clientSession = initArgs.clientSession;

    expect(clientSession).toBeDefined();

    // Test setRefreshToken
    clientSession.setRefreshToken('new_token');
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'new_token',
      expect.objectContaining({
        httpOnly: true,
        path: '/api/v1/auth',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 15,
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
        path: '/api/v1/auth',
        sameSite: 'lax',
      })
    );
  });

  it('should set cookie path and secure appropriately in production', async () => {
    mockVarsConfig.WEB_APP_URL = 'https://production.purpleledger.app'; // production
    mockVarsConfig.NODE_ENV = 'production';

    const middleware = makeAppContextInitMiddleware(
      mockAppContext,
      mockAccountingEntityRepo,
      mockAuthService,
      mockUserRepo,
      mockLogger,
      mockVarsConfig as IVarsConfig
    );

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    const initArgs = mockAppContext.init.mock.calls[0][0];
    const clientSession = initArgs.clientSession;

    // Test setRefreshToken
    clientSession.setRefreshToken('new_token');
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'new_token',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        path: '/api/v1/auth',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 15,
      })
    );

    // Test clearRefreshToken
    clientSession.clearRefreshToken();
    expect(mockRes.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        path: '/api/v1/auth',
        sameSite: 'lax',
      })
    );
  });
});
