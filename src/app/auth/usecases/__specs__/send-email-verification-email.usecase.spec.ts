import mockUserRepo from '../../../../domain/user/repos/__mocks__/user.repo.impl.mock';
import { IUser } from '../../../../domain/user/types/user.types';
import emailValue from '../../../../domain/user/values/email.vo';
import mockLogger from '../../../../shared/contracts/__mocks__/logger.contract.mock';
import appError from '../../../../shared/errors/app.error';
import { TEntityId } from '../../../../shared/types/uuid';
import mockAppContext from '../../../_internal/contracts/__mocks__/app-context.contract.mock';
import { IAppContextData } from '../../../_internal/contracts/app-context.contract';
import IEmailVerificationService from '../../contracts/email-verification-service.contract';
import authError from '../../errors/auth.error';
import makeSendEmailVerificationEmailUseCase from '../send-email-verification-email.usecase';

describe('makeSendEmailVerificationEmailUseCase', () => {
  const correlationId = 'test-corr-id';
  const emailVerificationService: jest.Mocked<IEmailVerificationService> = {
    send: jest.fn(),
  };

  const makeUseCase = () =>
    makeSendEmailVerificationEmailUseCase({
      appContext: mockAppContext,
      logger: mockLogger,
      userRepo: mockUserRepo,
      emailVerificationService,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppContext.get.mockReturnValue({
      correlationId,
    } as IAppContextData);
    emailVerificationService.send.mockResolvedValue(true);
  });

  it('rejects an invalid email', async () => {
    await expect(makeUseCase()('invalid-email')).rejects.toThrow(
      appError.UnprocessableEntity
    );
  });

  it('throws when the user is not found', async () => {
    const userEmail = 'notfound@example.com';
    mockUserRepo.findByEmail.mockResolvedValue(null);

    await expect(makeUseCase()(userEmail)).rejects.toThrow(
      authError.UserNotFound
    );
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(
      emailValue.normalize(userEmail),
      { correlationId }
    );
    expect(emailVerificationService.send).not.toHaveBeenCalled();
  });

  it('logs and returns when the email is already verified', async () => {
    const user: IUser = {
      id: 'test-user-id' as TEntityId,
      email: emailValue.make('verified@example.com'),
      emailVerified: true,
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    mockUserRepo.findByEmail.mockResolvedValue(user);

    await makeUseCase()(user.email);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Skipping sending email verification email as user email is already verified',
      { userId: user.id, email: user.email }
    );
    expect(emailVerificationService.send).not.toHaveBeenCalled();
  });

  it('delegates delivery for an unverified user', async () => {
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
    mockUserRepo.findByEmail.mockResolvedValue(user);

    await makeUseCase()(user.email);

    expect(emailVerificationService.send).toHaveBeenCalledWith(
      user,
      correlationId
    );
  });
});
