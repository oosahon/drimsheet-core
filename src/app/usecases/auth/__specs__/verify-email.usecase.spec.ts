import { IUser } from '../../../../domain/user/types/user.types';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import mockUserSessionRepo from '../../../../infra/persistence/repos/__mocks__/user-session.repo.impl.mock';
import mockUserRepo from '../../../../infra/persistence/repos/__mocks__/user.repo.impl.mock';
import mockAuthService from '../../../../infra/services/__mocks__/auth.service.mock';
import mockRepoService from '../../../../infra/services/__mocks__/repo.service.mock';
import {
  ErrorBadRequest,
  ErrorUnprocessableEntity,
} from '../../../../shared/value-objects/error';
import mockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import {
  IClientSession,
  IRequestContextData,
} from '../../../contracts/app/request-context.contract';
import { ITransactionContext } from '../../../contracts/infra/repo.contract';
import verifyEmailAddressUseCase from '../verify-email.usecase';

describe('verifyEmailAddressUseCase', () => {
  let mockClientSession: jest.Mocked<IClientSession>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClientSession = {
      getRefreshToken: jest.fn(),
      setRefreshToken: jest.fn(),
    };

    mockRepoService.runInTransaction.mockImplementation(async (cb) => {
      await cb('mock-tx' as unknown as ITransactionContext);
    });
  });

  it('should throw ErrorUnprocessableEntity if payload is invalid', async () => {
    const usecase = verifyEmailAddressUseCase(
      mockAuthService,
      mockUserRepo,
      mockRequestContext,
      mockEventBus,
      mockUserSessionRepo,
      mockRepoService
    );

    await expect(usecase(123 as any)).rejects.toThrow(ErrorUnprocessableEntity);
  });

  it('should successfully verify email and return tokens', async () => {
    const correlationId = 'test-corr-id';
    mockRequestContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
    } as unknown as IRequestContextData);

    const token = 'valid-token';
    const decodedToken = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'johndoe@example.com',
    } as any;
    const mockUser: IUser = {
      id: '123e4567-e89b-12d3-a456-426614174000' as any,
      email: 'johndoe@example.com' as any,
      emailVerified: false,
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockAuthService.verifySignupToken.mockResolvedValue(decodedToken);
    mockUserRepo.findById.mockResolvedValue(mockUser);
    mockAuthService.generateAccessToken.mockResolvedValue('new-auth-token');
    mockAuthService.generateRefreshToken.mockResolvedValue('new-refresh-token');

    const usecase = verifyEmailAddressUseCase(
      mockAuthService,
      mockUserRepo,
      mockRequestContext,
      mockEventBus,
      mockUserSessionRepo,
      mockRepoService
    );

    const result = await usecase(token);

    expect(mockRequestContext.get).toHaveBeenCalledTimes(2);
    expect(mockAuthService.verifySignupToken).toHaveBeenCalledWith(token);
    expect(mockUserRepo.findById).toHaveBeenCalledWith(decodedToken.id, {
      correlationId,
    });

    expect(mockUserRepo.save).toHaveBeenCalledTimes(1);
    // User save check
    const savedUserArgs = mockUserRepo.save.mock.calls.find(
      (c) => c[0].emailVerified === true
    );
    expect(savedUserArgs).toBeDefined();
    expect(savedUserArgs![0]).toMatchObject({
      id: '123e4567-e89b-12d3-a456-426614174000',
      emailVerified: true,
    });
    expect(savedUserArgs![1]).toEqual({ correlationId });

    expect(mockRepoService.runInTransaction).toHaveBeenCalled();
    expect(mockUserSessionRepo.save).toHaveBeenCalled();

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

  it('should throw ErrorUnauthorized if token is invalid or expired', async () => {
    const correlationId = 'test-corr-id';
    mockRequestContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
    } as unknown as IRequestContextData);

    const token = 'invalid-token';
    mockAuthService.verifySignupToken.mockResolvedValue(null);

    const usecase = verifyEmailAddressUseCase(
      mockAuthService,
      mockUserRepo,
      mockRequestContext,
      mockEventBus,
      mockUserSessionRepo,
      mockRepoService
    );

    await expect(usecase(token)).rejects.toThrow(ErrorBadRequest);
    await expect(usecase(token)).rejects.toThrow(
      'Invalid or expired verification token'
    );

    expect(mockAuthService.verifySignupToken).toHaveBeenCalledWith(token);
    expect(mockUserRepo.findById).not.toHaveBeenCalled();
    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should throw ErrorUnauthorized if user is not found', async () => {
    const correlationId = 'test-corr-id';
    mockRequestContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
    } as unknown as IRequestContextData);

    const token = 'valid-token';
    const decodedToken = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'johndoe@example.com',
    } as any;

    mockAuthService.verifySignupToken.mockResolvedValue(decodedToken);
    mockUserRepo.findById.mockResolvedValue(null);

    const usecase = verifyEmailAddressUseCase(
      mockAuthService,
      mockUserRepo,
      mockRequestContext,
      mockEventBus,
      mockUserSessionRepo,
      mockRepoService
    );

    await expect(usecase(token)).rejects.toThrow(ErrorBadRequest);
    await expect(usecase(token)).rejects.toThrow(
      'Invalid or expired verification token'
    );

    expect(mockAuthService.verifySignupToken).toHaveBeenCalledWith(token);
    expect(mockUserRepo.findById).toHaveBeenCalledWith(decodedToken.id, {
      correlationId,
    });
    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
