import { IUser } from '../../../../domain/user/types/user.types';
import emailValue from '../../../../domain/user/value-objects/email.vo';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import mockUserAuthRepo from '../../../../infra/persistence/repos/__mocks__/user-auth.repo.impl.mock';
import mockUserSessionRepo from '../../../../infra/persistence/repos/__mocks__/user-session.repo.impl.mock';
import mockUserRepo from '../../../../infra/persistence/repos/__mocks__/user.repo.impl.mock';
import mockAuthService from '../../../../infra/services/__mocks__/auth.service.mock';
import mockRepoService from '../../../../infra/services/__mocks__/repo.service.mock';
import {
  ErrorBadRequest,
  ErrorUnprocessableEntity,
} from '../../../../shared/value-objects/error';
import mockRequestContext, {
  mockClientSession,
} from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import { IUserAuth } from '../../../contracts/infra/auth-service.contract';
import makeLoginWithEmailUseCase from '../login-with-email.usecase';

describe('makeLoginWithEmailUseCase', () => {
  const correlationId = 'test-corr-id';

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
    } as unknown as IRequestContextData);
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
    makeLoginWithEmailUseCase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockEventBus,
      mockUserAuthRepo,
      mockUserSessionRepo,
      mockRepoService
    );

  it('should throw ErrorUnprocessableEntity if payload is invalid', async () => {
    const usecase = getUseCase();

    const invalidPayload = {
      email: 'not-an-email',
      password: '',
    } as unknown as Parameters<ReturnType<typeof makeLoginWithEmailUseCase>>[0];

    await expect(usecase(invalidPayload)).rejects.toThrow(
      ErrorUnprocessableEntity
    );
  });

  it('should successfully log in a user, overwrite old session, reset failed attempts, and return tokens', async () => {
    const mockUser = getMockUser();
    const mockUserAuth = getMockUserAuth({ failedLoginAttempts: 2 });
    mockClientSession.getRefreshToken.mockReturnValue('old-refresh-token');

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue(mockUserAuth);
    mockAuthService.comparePassword.mockResolvedValue(true);
    mockAuthService.generateAccessToken.mockResolvedValue('auth-token');
    mockAuthService.generateRefreshToken.mockResolvedValue('refresh-token');

    const usecase = getUseCase();
    const result = await usecase(validPayload);

    expect(mockRequestContext.get).toHaveBeenCalledTimes(2);
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(
      emailValue.make(validPayload.email),
      {
        correlationId,
      }
    );
    expect(mockAuthService.comparePassword).toHaveBeenCalledWith(
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
    expect(mockUserSessionRepo.save).toHaveBeenCalledWith(
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

  it('should throw ErrorBadRequest if user does not exist', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    const usecase = getUseCase();

    await expect(usecase(validPayload)).rejects.toThrow(ErrorBadRequest);
    await expect(usecase(validPayload)).rejects.toThrow(
      'Invalid email or password'
    );
    expect(mockAuthService.comparePassword).not.toHaveBeenCalled();
  });

  it('should throw ErrorBadRequest if userAuth record is not found', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(getMockUser());
    mockUserAuthRepo.findByUserId.mockResolvedValue(null);

    const usecase = getUseCase();

    await expect(usecase(validPayload)).rejects.toThrow(ErrorBadRequest);
    await expect(usecase(validPayload)).rejects.toThrow(
      'Invalid email or password'
    );
  });

  it('should throw ErrorBadRequest if max login attempts reached', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(getMockUser());
    mockUserAuthRepo.findByUserId.mockResolvedValue(
      getMockUserAuth({ failedLoginAttempts: 5 })
    );

    const usecase = getUseCase();

    await expect(usecase(validPayload)).rejects.toThrow(ErrorBadRequest);
    await expect(usecase(validPayload)).rejects.toThrow(
      'Account locked due to too many failed login attempts. Please reset your password.'
    );
  });

  it('should throw ErrorBadRequest and increment failed attempts if user has no password set', async () => {
    const mockUser = getMockUser();
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue(
      getMockUserAuth({ password: null })
    );

    const usecase = getUseCase();

    await expect(usecase(validPayload)).rejects.toThrow(ErrorBadRequest);
    await expect(usecase(validPayload)).rejects.toThrow('.');
    expect(mockAuthService.comparePassword).not.toHaveBeenCalled();
    expect(mockUserAuthRepo.incrementFailedLoginAttempts).toHaveBeenCalledWith(
      mockUser.id,
      { correlationId }
    );
  });

  it('should throw ErrorBadRequest and increment failed attempts if strategy does not include email', async () => {
    const mockUser = getMockUser();
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue(
      getMockUserAuth({ strategy: ['google'] })
    );

    const usecase = getUseCase();

    await expect(usecase(validPayload)).rejects.toThrow(ErrorBadRequest);
    await expect(usecase(validPayload)).rejects.toThrow(
      'You signed up with a different method.'
    );
    expect(mockUserAuthRepo.incrementFailedLoginAttempts).toHaveBeenCalledWith(
      mockUser.id,
      { correlationId }
    );
  });

  it('should throw ErrorBadRequest and increment failed attempts if password does not match', async () => {
    const mockUser = getMockUser();
    const payload = { ...validPayload, password: 'WrongPassword!' };

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue(getMockUserAuth());
    mockAuthService.comparePassword.mockResolvedValue(false);

    const usecase = getUseCase();

    await expect(usecase(payload)).rejects.toThrow(ErrorBadRequest);
    await expect(usecase(payload)).rejects.toThrow('Invalid email or password');
    expect(mockAuthService.comparePassword).toHaveBeenCalledWith(
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
    mockAuthService.comparePassword.mockResolvedValue(true);
    mockAuthService.generateAccessToken.mockResolvedValue('auth-token');
    mockAuthService.generateRefreshToken.mockResolvedValue('refresh-token');

    const usecase = getUseCase();
    await usecase(validPayload);

    expect(mockUserSessionRepo.delete).not.toHaveBeenCalled();
    expect(mockUserSessionRepo.save).toHaveBeenCalled();
  });
});
