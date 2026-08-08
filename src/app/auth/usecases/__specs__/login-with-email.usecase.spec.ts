import mockEventBus from '@shared/contracts/__mocks__/event-bus.mock';
import mockRepoService from '@shared/contracts/__mocks__/repo.mock';
import { ITransactionContext } from '@shared/types/repo.types';
import appError from '@shared/values/errors/app.error';

import { IUser } from '@domain/user/types/user.types';
import emailValue from '@domain/user/values/email.vo';

import mockPasswordService from '@app/auth/contracts/__mocks__/password-service.mock';
import mockAuthService from '@app/auth/contracts/__mocks__/token-service.mock';
import mockUserAuthRepo from '@app/auth/contracts/__mocks__/user-auth.repo.mock';
import mockUserSessionRepo from '@app/auth/contracts/__mocks__/user-session.repo.mock';
import { IUserAuth } from '@app/auth/contracts/auth.types';
import authError from '@app/auth/errors/auth.error';
import makeLoginWithEmailUseCase from '@app/auth/usecases/login-with-email.usecase';
import mockAppContext, {
  mockClientSession,
} from '@app/context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '@app/context/contracts/app-context.contract';
import { mockUserRepo } from '@app/user/contracts/__mocks__/user.repos.mock';

describe('makeLoginWithEmailUseCase', () => {
  const correlationId = 'test-corr-id';

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepoService.runInTransaction
      .mockReset()
      .mockImplementation(async (transactionFn) =>
        transactionFn('mock-tx' as unknown as ITransactionContext)
      );
    mockAppContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
    } as unknown as IAppContextData);
  });

  const validPayload = {
    email: 'johndoe@example.com',
    password: 'SecurePassword123!',
  };

  const getMockUser = () =>
    ({
      id: 'existing-user-id',
      email: emailValue.make(validPayload.email),
    }) as unknown as IUser;

  const getMockUserAuth = (overrides = {}) =>
    ({
      userId: 'existing-user-id',
      password: 'hashed-password',
      failedLoginAttempts: 0,
      strategy: ['email'],
      ...overrides,
    }) as unknown as IUserAuth;

  const getUseCase = () =>
    makeLoginWithEmailUseCase({
      reqContext: mockAppContext,
      userRepo: mockUserRepo,
      passwordService: mockPasswordService,
      tokenService: mockAuthService,
      eventBus: mockEventBus,
      userAuthRepo: mockUserAuthRepo,
      userSessionRepo: mockUserSessionRepo,
      repoService: mockRepoService,
    });

  it('should throw appError.UnprocessableEntity if payload is invalid', async () => {
    const usecase = getUseCase();

    const invalidPayload = {
      email: 'not-an-email',
      password: '',
    } as unknown as Parameters<ReturnType<typeof makeLoginWithEmailUseCase>>[0];

    await expect(usecase(invalidPayload)).rejects.toThrow(
      appError.UnprocessableEntity
    );
  });

  it('should successfully log in a user, overwrite old session, reset failed attempts, and return tokens', async () => {
    const mockUser = getMockUser();
    const mockUserAuth = getMockUserAuth({ failedLoginAttempts: 2 });
    mockClientSession.getRefreshToken.mockReturnValue('old-refresh-token');

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue(mockUserAuth);
    mockPasswordService.compare.mockResolvedValue(true);
    mockAuthService.generateAccessToken.mockResolvedValue('auth-token');
    mockAuthService.generateRefreshToken.mockResolvedValue('refresh-token');

    const usecase = getUseCase();
    const result = await usecase(validPayload);

    expect(mockAppContext.get).toHaveBeenCalledTimes(2);
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(
      emailValue.make(validPayload.email),
      {
        correlationId,
      }
    );
    expect(mockPasswordService.compare).toHaveBeenCalledWith(
      validPayload.password,
      mockUserAuth.password
    );
    expect(mockAuthService.generateAccessToken).toHaveBeenCalledWith(mockUser);
    expect(mockAuthService.generateRefreshToken).toHaveBeenCalledWith(mockUser);

    expect(mockRepoService.runInTransaction).toHaveBeenCalled();
    expect(mockUserSessionRepo.delete).toHaveBeenCalledWith(
      mockUser.id,
      'old-refresh-token',
      { correlationId, tx: 'mock-tx' }
    );
    expect(mockUserSessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        userId: mockUser.id,
        refreshToken: 'refresh-token',
        lastLoginAt: expect.any(Date),
        createdAt: expect.any(Date),
      }),
      { correlationId, tx: 'mock-tx' }
    );
    expect(mockClientSession.setRefreshToken).toHaveBeenCalledWith(
      'refresh-token'
    );

    expect(mockUserAuthRepo.resetFailedLoginAttempts).toHaveBeenCalledWith(
      mockUser.id,
      { correlationId }
    );
    expect(mockEventBus.publish).toHaveBeenCalled();

    expect(result).toEqual({ accessToken: 'auth-token' });
  });

  it('should throw authError.InvalidCredentials if user does not exist', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    const usecase = getUseCase();

    await expect(usecase(validPayload)).rejects.toThrow(
      authError.InvalidCredentials
    );
    expect(mockPasswordService.compare).not.toHaveBeenCalled();
  });

  it('should throw authError.InvalidCredentials if userAuth record is not found', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(getMockUser());
    mockUserAuthRepo.findByUserId.mockResolvedValue(null);

    const usecase = getUseCase();

    await expect(usecase(validPayload)).rejects.toThrow(
      authError.InvalidCredentials
    );
  });

  it('should throw authError.InvalidCredentials if max login attempts reached', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(getMockUser());
    mockUserAuthRepo.findByUserId.mockResolvedValue(
      getMockUserAuth({ failedLoginAttempts: 5 })
    );

    const usecase = getUseCase();

    await expect(usecase(validPayload)).rejects.toThrow(
      authError.InvalidCredentials
    );
  });

  it('should throw authError.InvalidCredentials and increment failed attempts if user has no password set', async () => {
    const mockUser = getMockUser();
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue(
      getMockUserAuth({ password: null })
    );

    const usecase = getUseCase();

    await expect(usecase(validPayload)).rejects.toThrow(
      authError.InvalidCredentials
    );
    expect(mockPasswordService.compare).not.toHaveBeenCalled();
    expect(mockUserAuthRepo.incrementFailedLoginAttempts).toHaveBeenCalledWith(
      mockUser.id,
      { correlationId }
    );
  });

  it('should throw authError.InvalidCredentials and increment failed attempts if strategy does not include email', async () => {
    const mockUser = getMockUser();
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue(
      getMockUserAuth({ strategy: ['google'] })
    );

    const usecase = getUseCase();

    await expect(usecase(validPayload)).rejects.toThrow(
      authError.InvalidCredentials
    );
    expect(mockUserAuthRepo.incrementFailedLoginAttempts).toHaveBeenCalledWith(
      mockUser.id,
      { correlationId }
    );
  });

  it('should throw authError.InvalidCredentials and increment failed attempts if password does not match', async () => {
    const mockUser = getMockUser();
    const payload = { ...validPayload, password: 'WrongPassword!' };

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue(getMockUserAuth());
    mockPasswordService.compare.mockResolvedValue(false);

    const usecase = getUseCase();

    await expect(usecase(payload)).rejects.toThrow(
      authError.InvalidCredentials
    );
    expect(mockPasswordService.compare).toHaveBeenCalledWith(
      payload.password,
      'hashed-password'
    );
    expect(mockUserAuthRepo.incrementFailedLoginAttempts).toHaveBeenCalledWith(
      mockUser.id,
      { correlationId }
    );
    expect(mockAuthService.generateAccessToken).not.toHaveBeenCalled();
  });

  it('should not delete session if no old refresh token exists', async () => {
    const mockUser = getMockUser();
    mockClientSession.getRefreshToken.mockReturnValue(null);

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue(getMockUserAuth());
    mockPasswordService.compare.mockResolvedValue(true);
    mockAuthService.generateAccessToken.mockResolvedValue('auth-token');
    mockAuthService.generateRefreshToken.mockResolvedValue('refresh-token');

    const usecase = getUseCase();
    await usecase(validPayload);

    expect(mockUserSessionRepo.delete).not.toHaveBeenCalled();
    expect(mockUserSessionRepo.create).toHaveBeenCalled();
  });
});
