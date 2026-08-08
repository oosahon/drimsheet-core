import mockCacheStorage from '@shared/contracts/__mocks__/cache-storage.mock';
import IVarsConfig from '@shared/contracts/vars-config.contract';
import { TEntityId } from '@shared/types/uuid';

import { IUser } from '@domain/user/types/user.types';
import emailValue from '@domain/user/values/email.vo';

import mockTokenService from '@app/auth/contracts/__mocks__/token-service.mock';
import makeEmailVerificationService, {
  EMAIL_VERIFICATION_COOL_DOWN_SECONDS,
} from '@app/auth/services/email-verification.service';
import mockTransactionalEmailService from '@app/notification/contracts/__mocks__/transactional-email-service.mock';

describe('makeEmailVerificationService', () => {
  const correlationId = 'test-corr-id';
  const user: IUser = {
    id: 'test-user-id' as TEntityId,
    email: emailValue.make('unverified@example.com'),
    emailVerified: false,
    firstName: 'John',
    lastName: 'Doe',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
  const varsConfig = {
    WEB_APP_URL: 'https://test-app.com',
  } as IVarsConfig;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('atomically reserves the cooldown and sends the verification email', async () => {
    mockCacheStorage.setIfNotExists.mockResolvedValue(true);
    mockTokenService.generateSignupToken.mockResolvedValue('token-123');
    const service = makeEmailVerificationService({
      cacheStorage: mockCacheStorage,
      tokenService: mockTokenService,
      transactionalEmailService: mockTransactionalEmailService,
      varsConfig,
    });

    await expect(service.send(user, correlationId)).resolves.toBe(true);

    expect(mockCacheStorage.setIfNotExists).toHaveBeenCalledWith(
      `app:auth:email-verification-cooldown:${user.id}`,
      true,
      EMAIL_VERIFICATION_COOL_DOWN_SECONDS
    );
    expect(
      mockTransactionalEmailService.sendEmailVerification
    ).toHaveBeenCalledWith({
      user,
      verificationLink:
        'https://test-app.com/auth/signup/complete?token=token-123',
      correlationId,
    });
  });

  it('does not issue a token or send while the cooldown is held', async () => {
    mockCacheStorage.setIfNotExists.mockResolvedValue(false);
    const service = makeEmailVerificationService({
      cacheStorage: mockCacheStorage,
      tokenService: mockTokenService,
      transactionalEmailService: mockTransactionalEmailService,
      varsConfig,
    });

    await expect(service.send(user, correlationId)).resolves.toBe(false);

    expect(mockTokenService.generateSignupToken).not.toHaveBeenCalled();
    expect(
      mockTransactionalEmailService.sendEmailVerification
    ).not.toHaveBeenCalled();
  });

  it('releases the cooldown reservation when delivery fails', async () => {
    const deliveryError = new Error('delivery failed');
    mockCacheStorage.setIfNotExists.mockResolvedValue(true);
    mockTokenService.generateSignupToken.mockResolvedValue('token-123');
    mockTransactionalEmailService.sendEmailVerification.mockRejectedValue(
      deliveryError
    );
    const service = makeEmailVerificationService({
      cacheStorage: mockCacheStorage,
      tokenService: mockTokenService,
      transactionalEmailService: mockTransactionalEmailService,
      varsConfig,
    });

    await expect(service.send(user, correlationId)).rejects.toBe(deliveryError);
    expect(mockCacheStorage.del).toHaveBeenCalledWith(
      `app:auth:email-verification-cooldown:${user.id}`
    );
  });
});
