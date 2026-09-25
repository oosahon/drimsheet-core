import mockEventBus from '@shared/contracts/__mocks__/event-bus.mock';
import { TEntityId } from '@shared/types/uuid';
import appError from '@shared/values/errors/app.error';

import actorError from '@domain/user/errors/actor.error';
import { IUser } from '@domain/user/types/user.types';
import emailValue from '@domain/user/values/email.vo';

import mockPasswordService from '@app/auth/contracts/__mocks__/password-service.mock';
import mockUserAuthRepo from '@app/auth/contracts/__mocks__/user-auth.repo.mock';
import mockUserAuthService from '@app/auth/contracts/__mocks__/user-auth.service.mock';
import mockUserSessionPersistenceService from '@app/auth/contracts/__mocks__/user-session-persistence.service.mock';
import mockUserSessionService from '@app/auth/contracts/__mocks__/user-session.service.mock';
import { IUserAuth, IUserSession } from '@app/auth/contracts/auth.types';
import { IUserSessionReference } from '@app/auth/contracts/user-session.service.contract';
import authError from '@app/auth/errors/auth.error';
import makeLoginWithEmailUseCase from '@app/auth/usecases/login-with-email.usecase';
import mockAppContext, {
  mockClientSession,
} from '@app/context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '@app/context/contracts/app-context.contract';
import { mockActorService } from '@app/user/contracts/__mocks__/actor.services.mock';
import { mockUserRepo } from '@app/user/contracts/__mocks__/user.repos.mock';

describe('makeLoginWithEmailUseCase', () => {
  const correlationId = 'test-corr-id';

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
    } as unknown as IAppContextData);
    mockUserAuthService.recordFailedLogin.mockImplementation((userAuth) => ({
      ...userAuth,
      failedLoginAttempts: userAuth.failedLoginAttempts + 1,
      version: userAuth.version + 1,
      updatedAt: new Date(),
    }));
    mockUserAuthService.resetFailedLoginAttempts.mockImplementation(
      (userAuth) => ({
        ...userAuth,
        failedLoginAttempts: 0,
        version: userAuth.version + 1,
        updatedAt: new Date(),
      })
    );
    mockUserSessionPersistenceService.replaceClientSession.mockResolvedValue();
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
      createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
      userId: 'existing-user-id',
      password: 'hashed-password',
      failedLoginAttempts: 0,
      strategy: ['email'],
      version: 1,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }) as unknown as IUserAuth;

  const getPreparedSession = (
    priorClientSession: IUserSessionReference | null = null
  ) => ({
    accessToken: 'auth-token',
    refreshToken: 'refresh-token',
    userSession: {
      createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
      id: 'session-id' as TEntityId,
      userId: 'existing-user-id' as TEntityId,
      refreshToken: 'refresh-token',
      lastLoginAt: new Date('2026-01-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } satisfies IUserSession,
    priorClientSession,
  });

  const getUseCase = () =>
    makeLoginWithEmailUseCase({
      actorService: mockActorService,
      reqContext: mockAppContext,
      userRepo: mockUserRepo,
      passwordService: mockPasswordService,
      eventBus: mockEventBus,
      userAuthRepo: mockUserAuthRepo,
      userAuthService: mockUserAuthService,
      userSessionService: mockUserSessionService,
      userSessionPersistenceService: mockUserSessionPersistenceService,
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
    const preparedSession = getPreparedSession({
      userId: mockUser.id,
      refreshToken: 'old-refresh-token',
    });
    mockUserSessionService.prepare.mockResolvedValue(preparedSession);

    const usecase = getUseCase();
    const result = await usecase(validPayload);

    expect(mockAppContext.get).toHaveBeenCalledTimes(1);
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
    expect(mockUserSessionService.prepare).toHaveBeenCalledWith(
      mockUser,
      'old-refresh-token'
    );
    expect(
      mockUserSessionPersistenceService.replaceClientSession
    ).toHaveBeenCalledWith(
      {
        userSession: preparedSession.userSession,
        priorClientSession: preparedSession.priorClientSession,
      },
      { correlationId }
    );
    expect(mockClientSession.setRefreshToken).toHaveBeenCalledWith(
      'refresh-token'
    );

    expect(mockUserAuthRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ failedLoginAttempts: 0, version: 2 }),
      { correlationId, expectedVersion: 1 }
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
    expect(mockUserAuthRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ failedLoginAttempts: 1, version: 2 }),
      { correlationId, expectedVersion: 1 }
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
    expect(mockUserAuthRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ failedLoginAttempts: 1, version: 2 }),
      { correlationId, expectedVersion: 1 }
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
    expect(mockUserAuthRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ failedLoginAttempts: 1, version: 2 }),
      { correlationId, expectedVersion: 1 }
    );
    expect(mockUserSessionService.prepare).not.toHaveBeenCalled();
  });

  it('should not delete session if no old refresh token exists', async () => {
    const mockUser = getMockUser();
    mockClientSession.getRefreshToken.mockReturnValue(null);

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue(getMockUserAuth());
    mockPasswordService.compare.mockResolvedValue(true);
    const preparedSession = getPreparedSession();
    mockUserSessionService.prepare.mockResolvedValue(preparedSession);

    const usecase = getUseCase();
    await usecase(validPayload);

    expect(mockUserSessionService.prepare).toHaveBeenCalledWith(mockUser, null);
    expect(
      mockUserSessionPersistenceService.replaceClientSession
    ).toHaveBeenCalledWith(
      { userSession: preparedSession.userSession, priorClientSession: null },
      { correlationId }
    );
  });
  it.each([actorError.Disabled, actorError.NotFound])(
    'refuses new sessions when actor resolution fails',
    async (ActorError) => {
      const user = getMockUser();
      mockUserRepo.findByEmail.mockResolvedValue(user);
      mockUserAuthRepo.findByUserId.mockResolvedValue(getMockUserAuth());
      mockPasswordService.compare.mockResolvedValue(true);
      mockActorService.resolveUser.mockRejectedValueOnce(new ActorError());
      await expect(getUseCase()(validPayload)).rejects.toThrow(ActorError);
      expect(mockActorService.resolveUser).toHaveBeenCalledWith(user, {
        correlationId,
      });
      expect(mockUserSessionService.prepare).not.toHaveBeenCalled();
      expect(
        mockUserSessionPersistenceService.replaceClientSession
      ).not.toHaveBeenCalled();
      expect(mockClientSession.setRefreshToken).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    }
  );
});
