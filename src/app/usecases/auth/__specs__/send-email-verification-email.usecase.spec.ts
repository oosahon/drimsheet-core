import { IUser } from '../../../../domain/user/types/user.types';
import emailValue from '../../../../domain/user/value-objects/email.vo';
import mockLogger from '../../../../infra/observability/__mocks__/logger.mock';
import mockUserRepo from '../../../../infra/persistence/repos/__mocks__/user.repo.impl.mock';
import mockAuthService from '../../../../infra/services/__mocks__/auth.service.mock';
import mockTransactionalEmailService from '../../../../infra/services/__mocks__/transactional-email.service.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import {
  AppError,
  ErrorUnprocessableEntity,
} from '../../../../shared/value-objects/error';
import mockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import sendEmailVerificationEmailUseCase from '../send-email-verification-email.usecase';

describe('sendEmailVerificationEmailUseCase', () => {
  const correlationId = 'test-corr-id';

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);
  });

  it('should throw ErrorUnprocessableEntity if payload is invalid', async () => {
    const usecase = sendEmailVerificationEmailUseCase(
      mockRequestContext,
      mockLogger,
      mockAuthService,
      mockUserRepo,
      mockTransactionalEmailService
    );

    await expect(usecase('invalid-email')).rejects.toThrow(
      ErrorUnprocessableEntity
    );
  });

  it('should throw AppError if user is not found', async () => {
    const userEmail = 'notfound@example.com';
    mockUserRepo.findByEmail.mockResolvedValue(null);

    const usecase = sendEmailVerificationEmailUseCase(
      mockRequestContext,
      mockLogger,
      mockAuthService,
      mockUserRepo,
      mockTransactionalEmailService
    );

    await expect(usecase(userEmail)).rejects.toThrow(AppError);
    await expect(usecase(userEmail)).rejects.toThrow('User not found');

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(
      emailValue.normalize(userEmail),
      {
        correlationId,
      }
    );
    expect(mockLogger.info).not.toHaveBeenCalled();
    expect(mockAuthService.getSignupVerificationLink).not.toHaveBeenCalled();
    expect(
      mockTransactionalEmailService.sendEmailVerification
    ).not.toHaveBeenCalled();
  });

  it('should log info and return early if user email is already verified', async () => {
    const userEmail = 'verified@example.com';
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

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);

    const usecase = sendEmailVerificationEmailUseCase(
      mockRequestContext,
      mockLogger,
      mockAuthService,
      mockUserRepo,
      mockTransactionalEmailService
    );

    await usecase(userEmail);

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(
      emailValue.normalize(userEmail),
      {
        correlationId,
      }
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Skipping sending email verification email as user email is already verified',
      {
        userId: mockUser.id,
        email: mockUser.email,
      }
    );
    expect(mockAuthService.getSignupVerificationLink).not.toHaveBeenCalled();
    expect(
      mockTransactionalEmailService.sendEmailVerification
    ).not.toHaveBeenCalled();
  });

  it('should generate verification link and send email if user is not verified', async () => {
    const userEmail = 'unverified@example.com';
    const mockUser: IUser = {
      id: 'test-user-id' as TEntityId,
      email: emailValue.make(userEmail),
      emailVerified: false,
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const verificationLink = 'https://example.com/verify?token=123';

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockAuthService.getSignupVerificationLink.mockReturnValue(verificationLink);

    const usecase = sendEmailVerificationEmailUseCase(
      mockRequestContext,
      mockLogger,
      mockAuthService,
      mockUserRepo,
      mockTransactionalEmailService
    );

    await usecase(userEmail);

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(
      emailValue.normalize(userEmail),
      {
        correlationId,
      }
    );
    expect(mockAuthService.getSignupVerificationLink).toHaveBeenCalledWith({
      id: mockUser.id,
    });
    expect(
      mockTransactionalEmailService.sendEmailVerification
    ).toHaveBeenCalledWith({
      user: mockUser,
      verificationLink,
      correlationId,
    });
    expect(mockLogger.info).not.toHaveBeenCalled();
  });
});
