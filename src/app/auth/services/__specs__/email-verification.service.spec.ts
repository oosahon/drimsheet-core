import { IUser } from '../../../../domain/user/types/user.types';
import emailValue from '../../../../domain/user/values/email.vo';
import { makeMockCacheStorage } from '../../../../shared/contracts/__mocks__/cache-storage.contract.mock';
import IVarsConfig from '../../../../shared/contracts/vars-config.contract';
import { TEntityId } from '../../../../shared/types/uuid';
import mockTransactionalEmailService from '../../../notification/contracts/__mocks__/transactional-email-service.contract.mock';
import mockTokenService from '../../contracts/__mocks__/token-service.contract.mock';
import makeEmailVerificationService, {
  EMAIL_VERIFICATION_COOLDOWN_SECONDS,
} from '../email-verification.service';

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
    jest.clearAllMocks();
  });

  it('atomically reserves the cooldown and sends the verification email', async () => {
    const cacheStorage = makeMockCacheStorage();
    mockTokenService.generateSignupToken.mockResolvedValue('token-123');
    const service = makeEmailVerificationService({
      cacheStorage,
      tokenService: mockTokenService,
      transactionalEmailService: mockTransactionalEmailService,
      varsConfig,
    });

    await expect(service.send(user, correlationId)).resolves.toBe(true);

    expect(cacheStorage.setIfNotExists).toHaveBeenCalledWith(
      `app:auth:email-verification-cooldown:${user.id}`,
      true,
      EMAIL_VERIFICATION_COOLDOWN_SECONDS
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
    const cacheStorage = makeMockCacheStorage();
    await cacheStorage.setIfNotExists(
      `app:auth:email-verification-cooldown:${user.id}`,
      true,
      EMAIL_VERIFICATION_COOLDOWN_SECONDS
    );
    const service = makeEmailVerificationService({
      cacheStorage,
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
    const cacheStorage = makeMockCacheStorage();
    const deliveryError = new Error('delivery failed');
    mockTokenService.generateSignupToken.mockResolvedValue('token-123');
    mockTransactionalEmailService.sendEmailVerification.mockRejectedValue(
      deliveryError
    );
    const service = makeEmailVerificationService({
      cacheStorage,
      tokenService: mockTokenService,
      transactionalEmailService: mockTransactionalEmailService,
      varsConfig,
    });

    await expect(service.send(user, correlationId)).rejects.toBe(deliveryError);
    expect(cacheStorage.del).toHaveBeenCalledWith(
      `app:auth:email-verification-cooldown:${user.id}`
    );
  });
});
