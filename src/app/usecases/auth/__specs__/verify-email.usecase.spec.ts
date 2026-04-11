import { IUser } from '../../../../domain/user/types/user.types';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import mockUserRepo from '../../../../infra/persistence/repos/__mocks__/user.repo.impl.mock';
import mockAuthService from '../../../../infra/services/__mocks__/auth.service.mock';
import { IEvent } from '../../../../shared/types/event.types';
import {
  ErrorUnauthorized,
  ErrorUnprocessableEntity,
} from '../../../../shared/value-objects/error';
import mockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import verifyEmailAddressUseCase from '../verify-email.usecase';

describe('verifyEmailAddressUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ErrorUnprocessableEntity if payload is invalid', async () => {
    const usecase = verifyEmailAddressUseCase(
      mockAuthService,
      mockUserRepo,
      mockRequestContext,
      mockEventBus
    );

    await expect(usecase(123 as any)).rejects.toThrow(ErrorUnprocessableEntity);
  });

  it('should successfully verify email and return tokens', async () => {
    const correlationId = 'test-corr-id';
    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);

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
      password: 'hashed-password',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockAuthService.verifyAuthToken.mockReturnValue(decodedToken);
    mockUserRepo.findById.mockResolvedValue(mockUser);
    mockAuthService.generateAuthToken.mockResolvedValue('new-auth-token');
    mockAuthService.generateRefreshToken.mockResolvedValue('new-refresh-token');

    const usecase = verifyEmailAddressUseCase(
      mockAuthService,
      mockUserRepo,
      mockRequestContext,
      mockEventBus
    );

    const result = await usecase(token);

    expect(mockRequestContext.get).toHaveBeenCalledTimes(1);
    expect(mockAuthService.verifyAuthToken).toHaveBeenCalledWith(token);
    expect(mockUserRepo.findById).toHaveBeenCalledWith(decodedToken.id, {
      correlationId,
    });

    expect(mockUserRepo.save).toHaveBeenCalledTimes(1);
    const savedUserArgs = mockUserRepo.save.mock.calls[0];
    expect(savedUserArgs[0]).toMatchObject({
      id: '123e4567-e89b-12d3-a456-426614174000',
      emailVerified: true,
    });
    expect(savedUserArgs[1]).toEqual({ correlationId });

    expect(mockEventBus.publish).toHaveBeenCalled();
    const publishCalls = (mockEventBus.publish as jest.Mock).mock.calls;
    expect(publishCalls.length).toBeGreaterThan(0);
    publishCalls.forEach(([events]) => {
      expect(Array.isArray(events)).toBe(true);
      (events as IEvent<unknown>[]).forEach((event) => {
        expect(event).toMatchObject({
          correlationId,
        });
      });
    });

    expect(mockAuthService.generateAuthToken).toHaveBeenCalledTimes(1);
    expect(mockAuthService.generateRefreshToken).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      authToken: 'new-auth-token',
      refreshToken: 'new-refresh-token',
    });
  });

  it('should throw ErrorUnauthorized if token is invalid or expired', async () => {
    const correlationId = 'test-corr-id';
    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);

    const token = 'invalid-token';
    mockAuthService.verifyAuthToken.mockReturnValue(null as any);

    const usecase = verifyEmailAddressUseCase(
      mockAuthService,
      mockUserRepo,
      mockRequestContext,
      mockEventBus
    );

    await expect(usecase(token)).rejects.toThrow(ErrorUnauthorized);
    await expect(usecase(token)).rejects.toThrow(
      'Invalid or expired verification token'
    );

    expect(mockAuthService.verifyAuthToken).toHaveBeenCalledWith(token);
    expect(mockUserRepo.findById).not.toHaveBeenCalled();
    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should throw ErrorUnauthorized if user is not found', async () => {
    const correlationId = 'test-corr-id';
    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);

    const token = 'valid-token';
    const decodedToken = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'johndoe@example.com',
    } as any;

    mockAuthService.verifyAuthToken.mockReturnValue(decodedToken);
    mockUserRepo.findById.mockResolvedValue(null);

    const usecase = verifyEmailAddressUseCase(
      mockAuthService,
      mockUserRepo,
      mockRequestContext,
      mockEventBus
    );

    await expect(usecase(token)).rejects.toThrow(ErrorUnauthorized);
    await expect(usecase(token)).rejects.toThrow(
      'Invalid or expired verification token'
    );

    expect(mockAuthService.verifyAuthToken).toHaveBeenCalledWith(token);
    expect(mockUserRepo.findById).toHaveBeenCalledWith(decodedToken.id, {
      correlationId,
    });
    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
