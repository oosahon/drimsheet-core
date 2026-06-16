import { IUser } from '../../../../domain/user/types/user.types';
import emailValue from '../../../../domain/user/value-objects/email.vo';
import mockLogger from '../../../../infra/observability/__mocks__/logger.mock';
import mockUserRepo from '../../../../infra/persistence/repos/user/__mocks__/user.repo.impl.mock';
import mockAuthService from '../../../../infra/services/__mocks__/auth.service.mock';
import mockRequestContext from '../../../../infra/services/__mocks__/request-context.mock';
import mockTransactionalEmailService from '../../../../infra/services/__mocks__/transactional-email.service.mock';
import { IRequestContextData } from '../../../../shared/contracts/request-context.contract';
import IVarsConfig from '../../../../shared/contracts/vars-config.contract';
import { TEntityId } from '../../../../shared/types/uuid';
import authError from '../../../auth/errors/auth.error';
import appError from '../../../shared/errors/app.error';
import makeSendEmailVerificationEmailUseCase from '../send-email-verification-email.usecase';

describe('makeSendEmailVerificationEmailUseCase', () => {
  const correlationId = 'test-corr-id';
  const mockVarsConfig = {
    WEB_APP_URL: 'https://test-app.com',
  } as IVarsConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);
  });

  it('should throw appError.UnprocessableEntity if payload is invalid', async () => {
    const usecase = makeSendEmailVerificationEmailUseCase(
      mockRequestContext,
      mockLogger,
      mockAuthService,
      mockUserRepo,
      mockTransactionalEmailService,
      mockVarsConfig
    );

    await expect(usecase('invalid-email')).rejects.toThrow(
      appError.UnprocessableEntity
    );
  });

  it('should throw AppError if user is not found', async () => {
    const userEmail = 'notfound@example.com';
    mockUserRepo.findByEmail.mockResolvedValue(null);

    const usecase = makeSendEmailVerificationEmailUseCase(
      mockRequestContext,
      mockLogger,
      mockAuthService,
      mockUserRepo,
      mockTransactionalEmailService,
      mockVarsConfig
    );

    await expect(usecase(userEmail)).rejects.toThrow(authError.UserNotFound);

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(
      emailValue.normalize(userEmail),
      {
        correlationId,
      }
    );
    expect(mockLogger.info).not.toHaveBeenCalled();
    expect(mockAuthService.generateSignupToken).not.toHaveBeenCalled();
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

    const usecase = makeSendEmailVerificationEmailUseCase(
      mockRequestContext,
      mockLogger,
      mockAuthService,
      mockUserRepo,
      mockTransactionalEmailService,
      mockVarsConfig
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
    expect(mockAuthService.generateSignupToken).not.toHaveBeenCalled();
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

    const token = '123';
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockAuthService.generateSignupToken.mockResolvedValue(token);

    const usecase = makeSendEmailVerificationEmailUseCase(
      mockRequestContext,
      mockLogger,
      mockAuthService,
      mockUserRepo,
      mockTransactionalEmailService,
      mockVarsConfig
    );

    await usecase(userEmail);

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(
      emailValue.normalize(userEmail),
      {
        correlationId,
      }
    );
    expect(mockAuthService.generateSignupToken).toHaveBeenCalledWith({
      id: mockUser.id,
    });

    const verificationLink = `https://test-app.com/auth/signup/complete?token=${token}`;
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
