import userEvents from '../../../../domain/user/events/user.events';
import { IUser } from '../../../../domain/user/types/user.types';
import emailValue from '../../../../domain/user/value-objects/email.vo';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import mockUserRepo from '../../../../infra/persistence/repos/__mocks__/user.repo.impl.mock';
import mockAuthService from '../../../../infra/services/__mocks__/auth.service.mock';
import mockTransactionalEmailService from '../../../../infra/services/__mocks__/transactional-email.service.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import mockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import getPasswordResetLinkUseCase from '../get-password-reset-link.usecase';

describe('getPasswordResetLinkUseCase', () => {
  const correlationId = 'test-corr-id';

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);
  });

  it('should return early if user is not found', async () => {
    const userEmail = 'notfound@example.com';
    mockUserRepo.findByEmail.mockResolvedValue(null);

    const usecase = getPasswordResetLinkUseCase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockTransactionalEmailService,
      mockEventBus
    );

    await usecase(userEmail);

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(
      emailValue.normalize(userEmail),
      {
        correlationId,
      }
    );
    expect(mockAuthService.generatePasswordResetToken).not.toHaveBeenCalled();
    expect(mockAuthService.getResetPasswordLink).not.toHaveBeenCalled();
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
    const resetLink =
      'https://example.com/reset-password?token=test-reset-token';

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockAuthService.generatePasswordResetToken.mockResolvedValue(resetToken);
    mockAuthService.getResetPasswordLink.mockReturnValue(resetLink);

    const usecase = getPasswordResetLinkUseCase(
      mockRequestContext,
      mockUserRepo,
      mockAuthService,
      mockTransactionalEmailService,
      mockEventBus
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
    expect(mockAuthService.getResetPasswordLink).toHaveBeenCalledWith(
      resetToken
    );
    expect(
      mockTransactionalEmailService.sendPasswordResetLink
    ).toHaveBeenCalledWith({
      user: mockUser,
      resetLink,
      correlationId,
    });
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      userEvents.requestedPasswordReset(mockUser)
    );
  });
});
