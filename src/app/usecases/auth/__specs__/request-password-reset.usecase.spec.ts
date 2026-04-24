import userEvents from '../../../../domain/user/events/user.events';
import { IUser } from '../../../../domain/user/types/user.types';
import emailValue from '../../../../domain/user/value-objects/email.vo';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import mockUserAuthRepo from '../../../../infra/persistence/repos/__mocks__/user-auth.repo.impl.mock';
import mockUserRepo from '../../../../infra/persistence/repos/__mocks__/user.repo.impl.mock';
import mockAuthService from '../../../../infra/services/__mocks__/auth.service.mock';
import mockTransactionalEmailService from '../../../../infra/services/__mocks__/transactional-email.service.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import { ErrorBadRequest } from '../../../../shared/value-objects/error';
import eventValue from '../../../../shared/value-objects/event.vo';
import mockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import { IUserAuth } from '../../../contracts/infra/auth-service.contract';
import makeRequestPasswordResetUseCase from '../request-password-reset.usecase';

describe('makeRequestPasswordResetUseCase', () => {
  const correlationId = 'test-corr-id';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01T00:00:00.000Z'));
    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return early if user is not found', async () => {
    const userEmail = 'notfound@example.com';
    mockUserRepo.findByEmail.mockResolvedValue(null);

    const usecase = makeRequestPasswordResetUseCase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockTransactionalEmailService,
      mockEventBus,
      mockUserAuthRepo
    );

    await usecase(userEmail);

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(
      emailValue.normalize(userEmail),
      {
        correlationId,
      }
    );
    expect(mockAuthService.generatePasswordResetToken).not.toHaveBeenCalled();
    expect(
      mockTransactionalEmailService.sendPasswordResetLink
    ).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should generate token, send email, and publish event if user is found', async () => {
    const userEmail = 'found@example.com';
    const mockUser: IUser = {
      id: 'test-user-id' as TEntityId,
      email: emailValue.make(userEmail),
      emailVerified: true,
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    const resetToken = 'test-reset-token';
    const { WEB_APP_URL } = require('../../../../infra/config/vars.config');
    const resetLink = `${WEB_APP_URL}/auth/reset-password?token=${resetToken}`;

    const mockUserAuth = {
      userId: mockUser.id,
      password: 'hashed-password',
      failedLoginAttempts: 0,
      strategy: ['email'],
    } as unknown as IUserAuth;

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue(mockUserAuth);
    mockAuthService.generatePasswordResetToken.mockResolvedValue(resetToken);

    const usecase = makeRequestPasswordResetUseCase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockTransactionalEmailService,
      mockEventBus,
      mockUserAuthRepo
    );

    await usecase(userEmail);

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(
      emailValue.normalize(userEmail),
      {
        correlationId,
      }
    );
    expect(mockAuthService.generatePasswordResetToken).toHaveBeenCalledWith(
      mockUser
    );
    expect(
      mockTransactionalEmailService.sendPasswordResetLink
    ).toHaveBeenCalledWith({
      user: mockUser,
      resetLink,
      correlationId,
    });
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      eventValue.enrich(userEvents.requestedPasswordReset(mockUser), {
        correlationId,
      })
    );
  });

  it('should throw ErrorBadRequest if user strategy does not include email', async () => {
    const userEmail = 'found@example.com';
    const mockUser: IUser = {
      id: 'test-user-id' as TEntityId,
      email: emailValue.make(userEmail),
      emailVerified: true,
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const mockUserAuth = {
      userId: mockUser.id,
      password: null,
      failedLoginAttempts: 0,
      strategy: ['google'],
    } as unknown as IUserAuth;

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue(mockUserAuth);

    const usecase = makeRequestPasswordResetUseCase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockTransactionalEmailService,
      mockEventBus,
      mockUserAuthRepo
    );

    await expect(usecase(userEmail)).rejects.toThrow(ErrorBadRequest);
    await expect(usecase(userEmail)).rejects.toThrow(
      'You signed up with a different method'
    );

    expect(mockAuthService.generatePasswordResetToken).not.toHaveBeenCalled();
    expect(
      mockTransactionalEmailService.sendPasswordResetLink
    ).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
