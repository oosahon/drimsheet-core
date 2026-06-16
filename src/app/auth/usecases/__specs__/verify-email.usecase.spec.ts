import userEntity from '../../../../domain/user/entities/user.entity';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import mockUserSessionRepo from '../../../../infra/persistence/repos/user/__mocks__/user-session.repo.impl.mock';

import mockUserRepo from '../../../../infra/persistence/repos/user/__mocks__/user.repo.impl.mock';
import mockAuthService from '../../../../infra/services/__mocks__/auth.service.mock';
import mockRepoService from '../../../../infra/services/__mocks__/repo.service.mock';
import mockRequestContext, {
  mockClientSession,
} from '../../../../infra/services/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../../shared/contracts/request-context.contract';
import authError from '../../../auth/errors/auth.error';
import appError from '../../../shared/errors/app.error';
import makeVerifyEmailAddressUseCase from '../verify-email.usecase';

describe('makeVerifyEmailAddressUseCase', () => {
  const correlationId = '854e4567-e89b-42d3-a456-426614174001';

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
    } as unknown as IRequestContextData);
  });

  it('should throw appError.UnprocessableEntity if payload is invalid', async () => {
    const usecase = makeVerifyEmailAddressUseCase(
      mockAuthService,
      mockUserRepo,
      mockRequestContext,
      mockEventBus,
      mockUserSessionRepo,
      mockRepoService
    );

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

    mockAuthService.verifySignupToken.mockResolvedValue(decodedToken as never);
    mockUserRepo.findById.mockResolvedValue(mockUser);
    mockAuthService.generateAccessToken.mockResolvedValue('new-auth-token');
    mockAuthService.generateRefreshToken.mockResolvedValue('new-refresh-token');

    const usecase = makeVerifyEmailAddressUseCase(
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
    mockAuthService.verifySignupToken.mockRejectedValue(
      new authError.InvalidToken()
    );

    const usecase = makeVerifyEmailAddressUseCase(
      mockAuthService,
      mockUserRepo,
      mockRequestContext,
      mockEventBus,
      mockUserSessionRepo,
      mockRepoService
    );

    await expect(usecase(token)).rejects.toThrow(authError.Base);

    expect(mockAuthService.verifySignupToken).toHaveBeenCalledWith(token);
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

    mockAuthService.verifySignupToken.mockResolvedValue(decodedToken as never);
    mockUserRepo.findById.mockResolvedValue(null);

    const usecase = makeVerifyEmailAddressUseCase(
      mockAuthService,
      mockUserRepo,
      mockRequestContext,
      mockEventBus,
      mockUserSessionRepo,
      mockRepoService
    );

    await expect(usecase(token)).rejects.toThrow(authError.InvalidToken);

    expect(mockAuthService.verifySignupToken).toHaveBeenCalledWith(token);
    expect(mockUserRepo.findById).toHaveBeenCalledWith(decodedToken.id, {
      correlationId,
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

    mockAuthService.verifySignupToken.mockResolvedValue(decodedToken as never);
    mockUserRepo.findById.mockResolvedValue(mockUser);
    mockAuthService.generateAccessToken.mockResolvedValue('new-auth-token');
    mockAuthService.generateRefreshToken.mockResolvedValue('new-refresh-token');

    const usecase = makeVerifyEmailAddressUseCase(
      mockAuthService,
      mockUserRepo,
      mockRequestContext,
      mockEventBus,
      mockUserSessionRepo,
      mockRepoService
    );

    const result = await usecase(token);

    // Save should NOT be called on the user repo because the email is already verified
    expect(mockUserRepo.update).not.toHaveBeenCalled();
    expect(mockAuthService.generateAccessToken).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ accessToken: 'new-auth-token' });

    expect(mockEventBus.publish).toHaveBeenCalledWith([]);
  });
});
