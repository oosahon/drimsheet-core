import userEvents from '../../../../domain/user/events/user.events';
import mockUserRepo from '../../../../domain/user/repos/__mocks__/user.repo.impl.mock';
import { IUser } from '../../../../domain/user/types/user.types';
import emailValue from '../../../../domain/user/values/email.vo';
import mockEventBus from '../../../../shared/contracts/__mocks__/event-bus.contract.mock';
import IVarsConfig from '../../../../shared/contracts/vars-config.contract';
import eventValue from '../../../../shared/events/event.vo';
import { TEntityId } from '../../../../shared/types/uuid';
import mockAppContext from '../../../_internal/contracts/__mocks__/app-context.contract.mock';
import { IAppContextData } from '../../../_internal/contracts/app-context.contract';
import mockTransactionalEmailService from '../../../notification/contracts/__mocks__/transactional-email-service.contract.mock';
import mockAuthService from '../../contracts/__mocks__/token-service.contract.mock';
import mockUserAuthRepo from '../../contracts/__mocks__/user-auth.repo.contract.mock';
import { IUserAuth } from '../../contracts/auth.types';
import authError from '../../errors/auth.error';
import makeRequestPasswordResetUseCase from '../request-password-reset.usecase';

describe('makeRequestPasswordResetUseCase', () => {
  const correlationId = 'test-corr-id';
  const mockVarsConfig = {
    WEB_APP_URL: 'https://test-app.com',
  } as IVarsConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01T00:00:00.000Z'));
    mockAppContext.get.mockReturnValue({
      correlationId,
    } as IAppContextData);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return early if user is not found', async () => {
    const userEmail = 'notfound@example.com';
    mockUserRepo.findByEmail.mockResolvedValue(null);

    const usecase = makeRequestPasswordResetUseCase({
      appContext: mockAppContext,
      userRepo: mockUserRepo,
      tokenService: mockAuthService,
      transactionEmailService: mockTransactionalEmailService,
      eventBus: mockEventBus,
      userAuthRepo: mockUserAuthRepo,
      varsConfig: mockVarsConfig,
    });

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
    const resetLink = `https://test-app.com/auth/reset-password?token=${resetToken}`;

    const mockUserAuth = {
      userId: mockUser.id,
      password: 'hashed-password',
      failedLoginAttempts: 0,
      strategy: ['email'],
    } as unknown as IUserAuth;

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockUserAuthRepo.findByUserId.mockResolvedValue(mockUserAuth);
    mockAuthService.generatePasswordResetToken.mockResolvedValue(resetToken);

    const usecase = makeRequestPasswordResetUseCase({
      appContext: mockAppContext,
      userRepo: mockUserRepo,
      tokenService: mockAuthService,
      transactionEmailService: mockTransactionalEmailService,
      eventBus: mockEventBus,
      userAuthRepo: mockUserAuthRepo,
      varsConfig: mockVarsConfig,
    });

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

    const usecase = makeRequestPasswordResetUseCase({
      appContext: mockAppContext,
      userRepo: mockUserRepo,
      tokenService: mockAuthService,
      transactionEmailService: mockTransactionalEmailService,
      eventBus: mockEventBus,
      userAuthRepo: mockUserAuthRepo,
      varsConfig: mockVarsConfig,
    });

    await expect(usecase(userEmail)).rejects.toThrow(authError.WrongStrategy);

    expect(mockAuthService.generatePasswordResetToken).not.toHaveBeenCalled();
    expect(
      mockTransactionalEmailService.sendPasswordResetLink
    ).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
