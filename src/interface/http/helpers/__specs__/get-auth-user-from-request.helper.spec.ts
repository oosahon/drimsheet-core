import { Request } from 'express';
import IAuthService from '../../../../app/shared/contracts/auth-service.contract';
import ILogger from '../../../../app/shared/contracts/logger.contract';
import IUserRepo from '../../../../domain/user/repos/user.repo';
import { IUser } from '../../../../domain/user/types/user.types';
import getAuthUserFromRequest from '../get-auth-user-from-request.helper';

describe('getAuthUserFromRequest', () => {
  let mockReq: Partial<Request>;
  let mockAuthService: jest.Mocked<IAuthService>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockUserRepo: jest.Mocked<IUserRepo>;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };

    mockAuthService = {
      getAuthUser: jest.fn(),
    } as unknown as jest.Mocked<IAuthService>;

    mockLogger = {
      error: jest.fn(),
    } as unknown as jest.Mocked<ILogger>;

    mockUserRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IUserRepo>;

    jest.clearAllMocks();
  });

  it('should return null if authorization header is missing', async () => {
    const result = await getAuthUserFromRequest(
      mockReq as Request,
      mockAuthService,
      mockLogger,
      mockUserRepo
    );
    expect(result).toBeNull();
  });

  it('should return null if authorization header exists but token is missing', async () => {
    mockReq.headers = { authorization: 'Bearer ' }; // Empty token after space
    const result = await getAuthUserFromRequest(
      mockReq as Request,
      mockAuthService,
      mockLogger,
      mockUserRepo
    );
    expect(result).toBeNull();
  });

  it('should propagate error if decoding token fails', async () => {
    mockReq.headers = {
      authorization: 'Bearer invalid-token',
      'x-correlation-id': 'corr-123',
    };
    const error = new Error('Token expired');
    mockAuthService.getAuthUser.mockRejectedValue(error);

    await expect(
      getAuthUserFromRequest(
        mockReq as Request,
        mockAuthService,
        mockLogger,
        mockUserRepo
      )
    ).rejects.toThrow(error);
  });

  it('should return user from repo if token decoding succeeds', async () => {
    mockReq.headers = {
      authorization: 'Bearer valid-token',
      'x-correlation-id': 'corr-123',
    };
    const authPayload = { id: 'user-123', exp: 12345 };
    const user = { id: 'user-123', email: 'test@example.com' } as IUser;

    mockAuthService.getAuthUser.mockResolvedValue(authPayload as any);
    mockUserRepo.findById.mockResolvedValue(user);

    const result = await getAuthUserFromRequest(
      mockReq as Request,
      mockAuthService,
      mockLogger,
      mockUserRepo
    );

    expect(mockAuthService.getAuthUser).toHaveBeenCalledWith('valid-token');
    expect(mockUserRepo.findById).toHaveBeenCalledWith('user-123', {
      correlationId: 'corr-123',
    });
    expect(result).toEqual(user);
  });
});
