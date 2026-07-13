import { IUser } from '../../../../domain/user/types/user.types';
import emailValue from '../../../../domain/user/value-objects/email.vo';
import mockUserRepo from '../../../../infra/persistence/repos/user/__mocks__/user.repo.impl.mock';
import mockAppContext, {
  mockClientSession,
} from '../../../../shared/contracts/__mocks__/app-context.contract.mock';
import mockEventBus from '../../../../shared/contracts/__mocks__/event-bus.contract.mock';
import mockRepoService from '../../../../shared/contracts/__mocks__/repo.contract.mock';
import { IAppContextData } from '../../../../shared/contracts/app-context.contract';
import { IEvent } from '../../../../shared/types/event.types';
import { TEntityId } from '../../../../shared/types/uuid';
import generateUUID from '../../../../shared/utils/uuid-generator';
import appError from '../../../shared/errors/app.error';
import mockAuthService from '../../contracts/__mocks__/auth-service.contract.mock';
import mockUserAuthRepo from '../../contracts/__mocks__/user-auth.repo.contract.mock';
import mockUserSessionRepo from '../../contracts/__mocks__/user-session.repo.contract.mock';
import { IUserAuth } from '../../contracts/auth-service.contract';
import authError from '../../errors/auth.error';
import makeResetPasswordUseCase from '../reset-password.usecase';

describe('makeResetPasswordUseCase', () => {
  const correlationId = 'test-corr-id';
  const idempotencyKey = 'idempotency-key';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01T00:00:00.000Z'));
    mockAppContext.get.mockReturnValue({
      correlationId,
      idempotencyKey,
      clientSession: mockClientSession,
    } as unknown as IAppContextData);
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
      makeAuthService: mockAuthService,
      eventBus: mockEventBus,
      userAuthRepo: mockUserAuthRepo,
      userSessionRepo: mockUserSessionRepo,
      repoService: mockRepoService,
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
    mockAuthService.verifyPasswordResetToken.mockRejectedValue(
      new authError.InvalidToken()
    );

    const usecase = getUseCase();
    const payload = getValidPayload();

    await expect(usecase(payload)).rejects.toThrow(authError.Base);
  });

  it('should throw an error if user cannot be found in DB', async () => {
    mockAuthService.verifyPasswordResetToken.mockResolvedValue({
      id: 'internal-id' as TEntityId,
    });
    mockUserRepo.findById.mockResolvedValue(null);

    const usecase = getUseCase();
    const payload = getValidPayload();

    await expect(usecase(payload)).rejects.toThrow(authError.InvalidToken);
  });

  it('should throw an error if the user auth record cannot be found in DB', async () => {
    mockAuthService.verifyPasswordResetToken.mockResolvedValue({
      id: 'internal-id' as TEntityId,
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

    mockAuthService.verifyPasswordResetToken.mockResolvedValue({
      id: mockUser.id,
    });
    mockUserRepo.findById.mockResolvedValue(mockUser);
    const existingUserAuth = {
      userId: mockUser.id,
      password: 'old-hash',
    } as unknown as IUserAuth;
    mockUserAuthRepo.findByUserId.mockResolvedValue(existingUserAuth);
    mockAuthService.hashPassword.mockResolvedValue('new-hash');
    mockAuthService.generateAccessToken.mockResolvedValue('mock-auth-token');
    mockAuthService.generateRefreshToken.mockResolvedValue(
      'mock-refresh-token'
    );

    const usecase = getUseCase();

    const payload = getValidPayload();
    const result = await usecase(payload);

    expect(mockAuthService.verifyPasswordResetToken).toHaveBeenCalledWith(
      payload.token
    );
    expect(mockUserRepo.findById).toHaveBeenCalledWith(mockUser.id, {
      correlationId,
    });
    expect(mockAuthService.hashPassword).toHaveBeenCalledWith(payload.password);
    expect(mockAuthService.generateAccessToken).toHaveBeenCalledWith(mockUser);

    expect(mockRepoService.runInTransaction).toHaveBeenCalled();
    expect(mockUserAuthRepo.update).toHaveBeenCalledWith(
      { ...existingUserAuth, password: 'new-hash', failedLoginAttempts: 0 },
      { correlationId, tx: 'mock-tx' }
    );
    expect(mockEventBus.publish).toHaveBeenCalled();

    const publishedArgs = (mockEventBus.publish as jest.Mock).mock
      .calls[0] as IEvent<IUser>[];
    expect(publishedArgs[0].correlationId).toBe(correlationId);
    expect(publishedArgs[0].idempotencyKey).toBe(idempotencyKey);

    expect(result).toEqual({
      accessToken: 'mock-auth-token',
    });
  });
});
