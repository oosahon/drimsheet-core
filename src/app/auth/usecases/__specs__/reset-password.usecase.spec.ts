import mockEventBus from '@shared/contracts/__mocks__/event-bus.mock';
import mockRepoService from '@shared/contracts/__mocks__/repo.mock';
import mockReporter from '@shared/contracts/__mocks__/reporter.mock';
import { ITransactionContext } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';
import generateUUID from '@shared/utils/uuid-generator';
import appError from '@shared/values/errors/app.error';
import { IEvent } from '@shared/values/events/types/event.types';

import { IUser } from '@domain/user/types/user.types';
import emailValue from '@domain/user/values/email.vo';

import mockPasswordService from '@app/auth/contracts/__mocks__/password-service.mock';
import mockAuthService from '@app/auth/contracts/__mocks__/token-service.mock';
import mockUserAuthRepo from '@app/auth/contracts/__mocks__/user-auth.repo.mock';
import mockUserSessionRepo from '@app/auth/contracts/__mocks__/user-session.repo.mock';
import { EAuthStrategy, IUserAuth } from '@app/auth/contracts/auth.types';
import authError from '@app/auth/errors/auth.error';
import makeResetPasswordUseCase from '@app/auth/usecases/reset-password.usecase';
import mockAppContext, {
  mockClientSession,
} from '@app/context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '@app/context/contracts/app-context.contract';
import { mockUserRepo } from '@app/user/contracts/__mocks__/user.repos.mock';

describe('makeResetPasswordUseCase', () => {
  const correlationId = 'test-corr-id';
  const idempotencyKey = 'idempotency-key';

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepoService.runInTransaction
      .mockReset()
      .mockImplementation(async (transactionFn) =>
        transactionFn('mock-tx' as unknown as ITransactionContext)
      );
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01T00:00:00.000Z'));
    mockAppContext.get.mockReturnValue({
      correlationId,
      idempotencyKey,
      clientSession: mockClientSession,
    } as unknown as IAppContextData);
    mockPasswordService.makePassword
      .mockReset()
      .mockImplementation((input) => input as string);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const getValidPayload = () => ({
    token: 'valid-reset-token',
    password: 'Password123!',
    confirmPassword: 'Password123!',
  });

  const getUseCase = () =>
    makeResetPasswordUseCase({
      appContext: mockAppContext,
      userRepo: mockUserRepo,
      passwordService: mockPasswordService,
      tokenService: mockAuthService,
      eventBus: mockEventBus,
      userAuthRepo: mockUserAuthRepo,
      userSessionRepo: mockUserSessionRepo,
      repoService: mockRepoService,
      reporter: mockReporter,
    });

  it('should explicitly fail validation if passwords do not match', async () => {
    const usecase = getUseCase();

    const payload = getValidPayload();
    payload.confirmPassword = 'DifferentPassword1!';

    await expect(usecase(payload)).rejects.toThrow(
      appError.UnprocessableEntity
    );
  });

  it('should propagate AuthError if the reset token is invalid or expired', async () => {
    mockAuthService.claimPasswordResetToken.mockRejectedValue(
      new authError.InvalidToken()
    );

    const usecase = getUseCase();
    const payload = getValidPayload();

    await expect(usecase(payload)).rejects.toThrow(authError.Base);
  });

  it('should throw an error if user cannot be found in DB', async () => {
    mockAuthService.claimPasswordResetToken.mockResolvedValue({
      id: 'internal-id' as TEntityId,
      owner: 'claim-owner',
    });
    mockUserRepo.findById.mockResolvedValue(null);

    const usecase = getUseCase();
    const payload = getValidPayload();

    await expect(usecase(payload)).rejects.toThrow(authError.InvalidToken);
    expect(mockAuthService.releasePasswordResetTokenClaim).toHaveBeenCalledWith(
      {
        id: 'internal-id',
        owner: 'claim-owner',
      }
    );
  });

  it('should throw an error if the user auth record cannot be found in DB', async () => {
    mockAuthService.claimPasswordResetToken.mockResolvedValue({
      id: 'internal-id' as TEntityId,
      owner: 'claim-owner',
    });
    mockUserRepo.findById.mockResolvedValue({ id: 'internal-id' } as IUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue(null);

    const usecase = getUseCase();
    const payload = getValidPayload();

    await expect(usecase(payload)).rejects.toThrow(authError.InvalidToken);
  });

  it('should successfully update the password and broadcast the event', async () => {
    const mockUser: IUser = {
      id: generateUUID(),
      email: emailValue.make('found@example.com'),
      emailVerified: true,
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockAuthService.claimPasswordResetToken.mockResolvedValue({
      id: mockUser.id,
      owner: 'claim-owner',
    });
    mockUserRepo.findById.mockResolvedValue(mockUser);
    const existingUserAuth = {
      userId: mockUser.id,
      password: 'old-hash',
      strategy: ['email'],
    } as unknown as IUserAuth;
    mockUserAuthRepo.findByUserId.mockResolvedValue(existingUserAuth);
    mockPasswordService.hash.mockResolvedValue('new-hash');
    mockAuthService.generateAccessToken.mockResolvedValue('mock-auth-token');
    mockAuthService.generateRefreshToken.mockResolvedValue(
      'mock-refresh-token'
    );

    const usecase = getUseCase();

    const payload = getValidPayload();
    const result = await usecase(payload);

    expect(mockAuthService.claimPasswordResetToken).toHaveBeenCalledWith(
      payload.token
    );
    expect(mockUserRepo.findById).toHaveBeenCalledWith(mockUser.id, {
      correlationId,
    });
    expect(mockPasswordService.makePassword).toHaveBeenCalledWith(
      payload.password
    );
    expect(mockPasswordService.hash).toHaveBeenCalledWith(payload.password);
    expect(mockAuthService.generateAccessToken).toHaveBeenCalledWith(mockUser);

    expect(mockRepoService.runInTransaction).toHaveBeenCalled();
    expect(mockUserAuthRepo.update).toHaveBeenCalledWith(
      {
        ...existingUserAuth,
        password: 'new-hash',
        failedLoginAttempts: 0,
        strategy: ['email'],
      },
      { correlationId, tx: 'mock-tx' }
    );
    expect(mockUserSessionRepo.deleteAllByUserId).toHaveBeenCalledWith(
      mockUser.id,
      { correlationId, tx: 'mock-tx' }
    );
    expect(mockUserSessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUser.id,
        refreshToken: 'mock-refresh-token',
      }),
      { correlationId, tx: 'mock-tx' }
    );
    expect(mockAuthService.finalizePasswordResetToken).toHaveBeenCalledWith({
      id: mockUser.id,
      owner: 'claim-owner',
    });
    expect(mockEventBus.publish).toHaveBeenCalled();
    expect(mockClientSession.setRefreshToken).toHaveBeenCalledWith(
      'mock-refresh-token'
    );

    const publishedArgs = (mockEventBus.publish as jest.Mock).mock
      .calls[0] as IEvent<IUser>[];
    expect(publishedArgs[0].correlationId).toBe(correlationId);
    expect(publishedArgs[0].idempotencyKey).toBe(idempotencyKey);

    expect(result).toEqual({
      accessToken: 'mock-auth-token',
    });
  });

  it('adds the email strategy when a Google-only user creates a password', async () => {
    const mockUser: IUser = {
      id: generateUUID(),
      email: emailValue.make('google-user@example.com'),
      emailVerified: true,
      firstName: 'Grace',
      lastName: 'Hopper',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    const existingUserAuth = {
      userId: mockUser.id,
      password: null,
      failedLoginAttempts: 0,
      strategy: ['google'],
    } as unknown as IUserAuth;

    mockAuthService.claimPasswordResetToken.mockResolvedValue({
      id: mockUser.id,
      owner: 'claim-owner',
    });
    mockUserRepo.findById.mockResolvedValue(mockUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue(existingUserAuth);
    mockPasswordService.hash.mockResolvedValue('new-hash');
    mockAuthService.generateAccessToken.mockResolvedValue('mock-auth-token');
    mockAuthService.generateRefreshToken.mockResolvedValue(
      'mock-refresh-token'
    );

    await getUseCase()(getValidPayload());

    expect(mockUserAuthRepo.update).toHaveBeenCalledWith(
      {
        ...existingUserAuth,
        password: 'new-hash',
        failedLoginAttempts: 0,
        strategy: ['google', 'email'],
      },
      { correlationId, tx: 'mock-tx' }
    );
  });

  it('returns committed success and reports token finalization failure', async () => {
    const mockUser = {
      id: generateUUID(),
      email: emailValue.make('committed@example.com'),
      emailVerified: true,
    } as IUser;
    mockAuthService.claimPasswordResetToken.mockResolvedValue({
      id: mockUser.id,
      owner: 'claim-owner',
    });
    mockUserRepo.findById.mockResolvedValue(mockUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue({
      userId: mockUser.id,
      strategy: [EAuthStrategy.Email],
    } as IUserAuth);
    mockPasswordService.hash.mockResolvedValue('new-hash');
    mockAuthService.generateAccessToken.mockResolvedValue('access-token');
    mockAuthService.generateRefreshToken.mockResolvedValue('refresh-token');
    const failure = new Error('cache unavailable');
    mockAuthService.finalizePasswordResetToken.mockRejectedValue(failure);

    await expect(getUseCase()(getValidPayload())).resolves.toEqual({
      accessToken: 'access-token',
    });
    expect(mockReporter.report).toHaveBeenCalledWith(
      'auth.password_reset.finalization_failed',
      failure,
      {
        operation: 'finalize-password-reset-token',
      }
    );
    expect(
      mockAuthService.releasePasswordResetTokenClaim
    ).not.toHaveBeenCalled();
  });

  it('reports claim release failure when cleanup fails during error handling', async () => {
    const mockUser = {
      id: generateUUID(),
      email: emailValue.make('cleanup-failure@example.com'),
      emailVerified: true,
    } as IUser;

    const tokenPayload = {
      id: mockUser.id,
      owner: 'claim-owner',
    };

    mockAuthService.claimPasswordResetToken.mockResolvedValue(tokenPayload);
    const dbError = new Error('Database lookup failure');
    mockUserRepo.findById.mockRejectedValue(dbError);

    const cleanupError = new Error('Redis connection failure');
    mockAuthService.releasePasswordResetTokenClaim.mockRejectedValue(
      cleanupError
    );

    await expect(getUseCase()(getValidPayload())).rejects.toThrow(dbError);

    expect(mockReporter.report).toHaveBeenCalledWith(
      'auth.password_reset.claim_release_failed',
      cleanupError,
      {
        operation: 'release-password-reset-token-claim',
      }
    );
  });

  it('does not release claim if error is thrown after commit', async () => {
    const mockUser = {
      id: generateUUID(),
      email: emailValue.make('after-commit-failure@example.com'),
      emailVerified: true,
    } as IUser;

    const tokenPayload = {
      id: mockUser.id,
      owner: 'claim-owner',
    };

    mockAuthService.claimPasswordResetToken.mockResolvedValue(tokenPayload);
    mockUserRepo.findById.mockResolvedValue(mockUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue({
      userId: mockUser.id,
      strategy: [EAuthStrategy.Email],
    } as IUserAuth);
    mockPasswordService.hash.mockResolvedValue('new-hash');
    mockAuthService.generateAccessToken.mockResolvedValue('access-token');
    mockAuthService.generateRefreshToken.mockResolvedValue('refresh-token');

    // Force an error after commit
    mockClientSession.setRefreshToken.mockImplementationOnce(() => {
      throw new Error('Context error after commit');
    });

    await expect(getUseCase()(getValidPayload())).rejects.toThrow(
      'Context error after commit'
    );

    expect(
      mockAuthService.releasePasswordResetTokenClaim
    ).not.toHaveBeenCalled();
  });
});
