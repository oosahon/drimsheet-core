import userEvents from '../../../domain/user/events/user.events';
import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/values/email.vo';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import IVarsConfig from '../../../shared/contracts/vars-config.contract';
import eventValue from '../../../shared/events/event.vo';
import IAppContext from '../../_internal/contracts/app-context.contract';
import ITransactionalEmailService from '../../notification/contracts/transactional-email-service.contract';
import ITokenService from '../contracts/token-service.contract';
import IUserAuthRepo from '../contracts/user-auth.repo.contract';

interface IDependencies {
  appContext: IAppContext;
  userRepo: IUserRepo;
  tokenService: ITokenService;
  transactionEmailService: ITransactionalEmailService;
  eventBus: IEventBus;
  userAuthRepo: IUserAuthRepo;
  varsConfig: IVarsConfig;
}

export default function makeRequestPasswordResetUseCase(deps: IDependencies) {
  return async (userEmail: string) => {
    const { correlationId } = deps.appContext.get();

    const normalizedEmail = emailValue.normalize(userEmail);

    const user = await deps.userRepo.findByEmail(normalizedEmail, {
      correlationId,
    });

    if (!user) {
      return;
    }

    await deps.userAuthRepo.findByUserId(user.id, {
      correlationId,
    });

    const resetToken = await deps.tokenService.generatePasswordResetToken(user);
    const resetLink = `${deps.varsConfig.WEB_APP_URL}/auth/reset-password?token=${resetToken}`;

    await deps.transactionEmailService.sendPasswordResetLink({
      user,
      resetLink,
      correlationId,
    });

    const event = userEvents.requestedPasswordReset(user);

    deps.eventBus.publish(eventValue.enrich(event, { correlationId }));
  };
}
