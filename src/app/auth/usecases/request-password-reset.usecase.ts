import userEvents from '../../../domain/user/events/user.events';
import IUserRepo from '../../../domain/user/repos/user.repo';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import IVarsConfig from '../../../shared/contracts/vars-config.contract';
import eventValue from '../../../shared/events/event.vo';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import IAppContext from '../../context/contracts/app-context.contract';
import ITransactionalEmailService from '../../notification/contracts/transactional-email-service.contract';
import ITokenService from '../contracts/token-service.contract';
import IUserAuthRepo from '../contracts/user-auth.repo.contract';
import { requestPasswordResetReqValidation } from '../dtos/auth/auth.dto.validation';

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
    zodValidationRunner(requestPasswordResetReqValidation, {
      email: userEmail,
    });
    const { correlationId } = deps.appContext.get();

    const normalizedEmail = userEmail.trim().toLowerCase();

    const user = await deps.userRepo.findByEmail(normalizedEmail, {
      correlationId,
    });

    if (!user) {
      return;
    }

    const userAuth = await deps.userAuthRepo.findByUserId(user.id, {
      correlationId,
    });
    if (!userAuth) {
      return;
    }

    const resetToken = await deps.tokenService.generatePasswordResetToken(user);
    const resetLink = `${deps.varsConfig.WEB_APP_URL}/auth/reset-password?token=${resetToken}`;

    await deps.transactionEmailService.sendPasswordResetLink({
      user,
      resetLink,
      correlationId,
    });

    const event = userEvents.requestedPasswordReset(user);

    await deps.eventBus.publish(eventValue.enrich(event, { correlationId }));
  };
}
