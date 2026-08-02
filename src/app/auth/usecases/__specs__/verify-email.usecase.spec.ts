import userEntity from '../../../../domain/user/entities/user.entity';
import IUserRepo from '../../../../domain/user/repos/user.repo';
import mockEventBus from '../../../../shared/contracts/__mocks__/event-bus.mock';
import mockRepoService from '../../../../shared/contracts/__mocks__/repo.mock';
import { ITransactionContext } from '../../../../shared/types/repo.types';
import appError from '../../../../shared/values/errors/app.error';
import mockAppContext, {
  mockClientSession,
} from '../../../context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '../../../context/contracts/app-context.contract';
import mockAuthService from '../../contracts/__mocks__/token-service.mock';
import mockUserSessionRepo from '../../contracts/__mocks__/user-session.repo.mock';
import authError from '../../errors/auth.error';
import makeVerifyEmailAddressUseCase from '../verify-email.usecase';

const mockUserRepo: jest.Mocked<IUserRepo> = {
  create: jest.fn(),
  update: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  delete: jest.fn(),
};

describe('makeVerifyEmailAddressUseCase', () => {
  const correlationId = '854e4567-e89b-42d3-a456-426614174001';

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

  it('should throw appError.UnprocessableEntity if payload is invalid', async () => {
    const usecase = makeVerifyEmailAddressUseCase({
      tokenService: mockAuthService,
      userRepo: mockUserRepo,
      appContext: mockAppContext,
      eventBus: mockEventBus,
      userSessionRepo: mockUserSessionRepo,
      repoService: mockRepoService,
    });

    await expect(usecase(123 as unknown as string)).rejects.toThrow(
      appError.UnprocessableEntity
    );
  });

  it('should successfully verify email and return tokens', async () => {
    const token = 'valid-token';
    const [mockUser] = userEntity.make({
      email: 'johndoe@example.com',
      emailVerified: false,
      firstName: 'John',
      lastName: 'Doe',
    });
    const decodedToken = {
      id: mockUser.id,
      email: 'johndoe@example.com',
    };

    mockAuthService.claimSignupToken.mockResolvedValue(decodedToken as never);
    mockUserRepo.findById.mockResolvedValue(mockUser);
    mockAuthService.generateAccessToken.mockResolvedValue('new-auth-token');
    mockAuthService.generateRefreshToken.mockResolvedValue('new-refresh-token');

    const usecase = makeVerifyEmailAddressUseCase({
      tokenService: mockAuthService,
      userRepo: mockUserRepo,
      appContext: mockAppContext,
      eventBus: mockEventBus,
      userSessionRepo: mockUserSessionRepo,
      repoService: mockRepoService,
    });

    const result = await usecase(token);

    expect(mockAppContext.get).toHaveBeenCalledTimes(2);
    expect(mockAuthService.claimSignupToken).toHaveBeenCalledWith(token);
    expect(mockUserRepo.findById).toHaveBeenCalledWith(decodedToken.id, {
      correlationId,
      lock: 'update',
      tx: 'mock-tx',
    });

    expect(mockUserRepo.update).toHaveBeenCalledTimes(1);
    // User update check
    const savedUserArgs = mockUserRepo.update.mock.calls.find(
      (c) => c[0].emailVerified === true
    );
    expect(savedUserArgs).toBeDefined();
    expect(savedUserArgs![0]).toMatchObject({
      id: mockUser.id,
      emailVerified: true,
    });
    expect(savedUserArgs![1]).toMatchObject({
      correlationId,
      history: expect.any(Object),
    });

    expect(mockRepoService.runInTransaction).toHaveBeenCalled();
    expect(mockUserSessionRepo.create).toHaveBeenCalled();

    expect(mockEventBus.publish).toHaveBeenCalled();
    const publishCalls = (mockEventBus.publish as jest.Mock).mock.calls;
    expect(publishCalls.length).toBeGreaterThan(0);
    publishCalls.forEach(([events]) => {
      const eventsArray = Array.isArray(events) ? events : [events];
      eventsArray.forEach((event) => {
        expect(event).toMatchObject({
          correlationId,
        });
      });
    });

    expect(mockAuthService.generateAccessToken).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      accessToken: 'new-auth-token',
    });
  });

  it('should propagate AuthError if token is invalid or expired', async () => {
    const token = 'invalid-token';
    mockAuthService.claimSignupToken.mockRejectedValue(
      new authError.InvalidToken()
    );

    const usecase = makeVerifyEmailAddressUseCase({
      tokenService: mockAuthService,
      userRepo: mockUserRepo,
      appContext: mockAppContext,
      eventBus: mockEventBus,
      userSessionRepo: mockUserSessionRepo,
      repoService: mockRepoService,
    });

    await expect(usecase(token)).rejects.toThrow(authError.Base);

    expect(mockAuthService.claimSignupToken).toHaveBeenCalledWith(token);
    expect(mockUserRepo.findById).not.toHaveBeenCalled();
    expect(mockUserRepo.update).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should throw appError.Unauthorized if user is not found', async () => {
    const token = 'valid-token';
    const decodedToken = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'johndoe@example.com',
    };

    mockAuthService.claimSignupToken.mockResolvedValue(decodedToken as never);
    mockUserRepo.findById.mockResolvedValue(null);

    const usecase = makeVerifyEmailAddressUseCase({
      tokenService: mockAuthService,
      userRepo: mockUserRepo,
      appContext: mockAppContext,
      eventBus: mockEventBus,
      userSessionRepo: mockUserSessionRepo,
      repoService: mockRepoService,
    });

    await expect(usecase(token)).rejects.toThrow(authError.InvalidToken);

    expect(mockAuthService.claimSignupToken).toHaveBeenCalledWith(token);
    expect(mockUserRepo.findById).toHaveBeenCalledWith(decodedToken.id, {
      correlationId,
      lock: 'update',
      tx: 'mock-tx',
    });
    expect(mockUserRepo.update).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should not update user if email is already verified', async () => {
    const token = 'valid-token';
    const [mockUser] = userEntity.make({
      email: 'johndoe@example.com',
      emailVerified: true,
      firstName: 'John',
      lastName: 'Doe',
    });
    const decodedToken = {
      id: mockUser.id,
      email: 'johndoe@example.com',
    };

    mockAuthService.claimSignupToken.mockResolvedValue(decodedToken as never);
    mockUserRepo.findById.mockResolvedValue(mockUser);
    mockAuthService.generateAccessToken.mockResolvedValue('new-auth-token');
    mockAuthService.generateRefreshToken.mockResolvedValue('new-refresh-token');

    const usecase = makeVerifyEmailAddressUseCase({
      tokenService: mockAuthService,
      userRepo: mockUserRepo,
      appContext: mockAppContext,
      eventBus: mockEventBus,
      userSessionRepo: mockUserSessionRepo,
      repoService: mockRepoService,
    });

    const result = await usecase(token);

    // Save should NOT be called on the user repo because the email is already verified
    expect(mockUserRepo.update).not.toHaveBeenCalled();
    expect(mockAuthService.generateAccessToken).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ accessToken: 'new-auth-token' });

    expect(mockEventBus.publish).toHaveBeenCalledWith([]);
  });

  it('should release signup token claim and rethrow generic error', async () => {
    const token = 'valid-token';
    const decodedToken = {
      id: 'some-user-uuid',
      email: 'johndoe@example.com',
    };

    mockAuthService.claimSignupToken.mockResolvedValue(decodedToken as never);
    const dbError = new Error('Database connection failed');
    mockUserRepo.findById.mockRejectedValue(dbError);

    const usecase = makeVerifyEmailAddressUseCase({
      tokenService: mockAuthService,
      userRepo: mockUserRepo,
      appContext: mockAppContext,
      eventBus: mockEventBus,
      userSessionRepo: mockUserSessionRepo,
      repoService: mockRepoService,
    });

    await expect(usecase(token)).rejects.toThrow('Database connection failed');

    expect(mockAuthService.claimSignupToken).toHaveBeenCalledWith(token);
    expect(mockAuthService.releaseSignupTokenClaim).toHaveBeenCalledWith(
      decodedToken.id
    );
  });
});
