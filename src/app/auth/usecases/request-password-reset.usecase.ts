import userEvents from '../../../domain/user/events/user.events';
import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/value-objects/email.vo';
import eventValue from '../../../shared/value-objects/event.vo';
import IUserAuthRepo from '../../auth/contracts/user-auth.repo.contract';
import authError from '../../auth/errors/auth.error';
import ITransactionalEmailService from '../../notification/contracts/transactional-email-service.contract';
import IEventBus from '../../shared/contracts/event-bus.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import IVarsConfig from '../../shared/contracts/vars-config.contract';
import IAuthService, {
  EAuthStrategy,
} from '../contracts/auth-service.contract';

export default function makeRequestPasswordResetUseCase(
  requestContext: IRequestContext,
  userRepo: IUserRepo,
  makeAuthService: IAuthService,
  transactionEmailService: ITransactionalEmailService,
  eventBus: IEventBus,
  userAuthRepo: IUserAuthRepo,
  varsConfig: IVarsConfig
) {
  return async (userEmail: string) => {
    const { correlationId } = requestContext.get();

    const normalizedEmail = emailValue.normalize(userEmail);

    const user = await userRepo.findByEmail(normalizedEmail, { correlationId });

    if (!user) {
      return;
    }

    const userAuth = await userAuthRepo.findByUserId(user.id, {
      correlationId,
    });

    if (!userAuth || !userAuth.strategy.includes(EAuthStrategy.Email)) {
      throw new authError.WrongStrategy();
    }

    const resetToken = await makeAuthService.generatePasswordResetToken(user);
    const resetLink = `${varsConfig.WEB_APP_URL}/auth/reset-password?token=${resetToken}`;

    await transactionEmailService.sendPasswordResetLink({
      user,
      resetLink,
      correlationId,
    });

    const event = userEvents.requestedPasswordReset(user);

    eventBus.publish(eventValue.enrich(event, { correlationId }));
  };
}
