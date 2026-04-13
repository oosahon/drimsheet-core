import userEvents from '../../../domain/user/events/user.events';
import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/value-objects/email.vo';
import IRequestContext from '../../contracts/app/request-context.contract';
import IAuthService from '../../contracts/infra/auth-service.contract';
import IEventBus from '../../contracts/infra/event-bus.contract';
import ITransactionalEmailService from '../../contracts/infra/transactional-email-service.contract';

export default function getPasswordResetLinkUseCase(
  requestContext: IRequestContext,
  userRepo: IUserRepo,
  authService: IAuthService,
  transactionEmailService: ITransactionalEmailService,
  eventBus: IEventBus
) {
  return async (userEmail: string) => {
    const { correlationId } = requestContext.get();

    const normalizedEmail = emailValue.normalize(userEmail);

    const user = await userRepo.findByEmail(normalizedEmail, { correlationId });

    if (!user) {
      return;
    }

    const resetToken = await authService.generatePasswordResetToken(user);
    const resetLink = authService.getResetPasswordLink(resetToken);

    await transactionEmailService.sendPasswordResetLink({
      user,
      resetLink,
      correlationId,
    });

    eventBus.publish(userEvents.requestedPasswordReset(user));
  };
}
