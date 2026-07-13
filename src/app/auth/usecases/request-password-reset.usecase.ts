import userEvents from '../../../domain/user/events/user.events';
import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/values/email.vo';
import IAppContext from '../../../shared/contracts/app-context.contract';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import IVarsConfig from '../../../shared/contracts/vars-config.contract';
import eventValue from '../../../shared/events/event.vo';
import ITransactionalEmailService from '../../notification/contracts/transactional-email-service.contract';
import IAuthService, {
  EAuthStrategy,
} from '../contracts/auth-service.contract';
import IUserAuthRepo from '../contracts/user-auth.repo.contract';
import authError from '../errors/auth.error';

interface IDependencies {
  appContext: IAppContext;
  userRepo: IUserRepo;
  makeAuthService: IAuthService;
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

    const userAuth = await deps.userAuthRepo.findByUserId(user.id, {
      correlationId,
    });

    if (!userAuth || !userAuth.strategy.includes(EAuthStrategy.Email)) {
      throw new authError.WrongStrategy();
    }

    const resetToken =
      await deps.makeAuthService.generatePasswordResetToken(user);
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
