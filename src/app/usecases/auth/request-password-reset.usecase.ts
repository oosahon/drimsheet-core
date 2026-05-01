import userEvents from '../../../domain/user/events/user.events';
import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/value-objects/email.vo';
import { WEB_APP_URL } from '../../../infra/config/vars.config';
import eventValue from '../../../shared/value-objects/event.vo';
import IRequestContext from '../../contracts/app/request-context.contract';
import IAuthService, {
  EAuthStrategy,
} from '../../contracts/infra/auth-service.contract';
import IEventBus from '../../contracts/infra/event-bus.contract';
import ITransactionalEmailService from '../../contracts/infra/transactional-email-service.contract';
import IUserAuthRepo from '../../contracts/repos/user-auth.repo.contract';
import authError from '../../errors/auth.error';

export default function makeRequestPasswordResetUseCase(
  requestContext: IRequestContext,
  userRepo: IUserRepo,
  makeAuthService: IAuthService,
  transactionEmailService: ITransactionalEmailService,
  eventBus: IEventBus,
  userAuthRepo: IUserAuthRepo
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
    const resetLink = `${WEB_APP_URL}/auth/reset-password?token=${resetToken}`;

    await transactionEmailService.sendPasswordResetLink({
      user,
      resetLink,
      correlationId,
    });

    const event = userEvents.requestedPasswordReset(user);

    eventBus.publish(eventValue.enrich(event, { correlationId }));
  };
}
