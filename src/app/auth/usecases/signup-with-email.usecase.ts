import userEntity from '../../../domain/user/entities/user.entity';
import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/values/email.vo';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import eventValue from '../../../shared/events/event.vo';
import historyValue from '../../../shared/history/history.vo';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import IAppContext from '../../_internal/contracts/app-context.contract';
import { EAuthStrategy } from '../contracts/auth.types';
import IEmailVerificationService from '../contracts/email-verification-service.contract';
import IPasswordService from '../contracts/password-service.contract';
import IUserAuthRepo from '../contracts/user-auth.repo.contract';
import { IUserSignupReq } from '../dtos/auth/auth.dto';
import { userSignupReqValidation } from '../dtos/auth/auth.dto.validation';

interface IDependencies {
  appContext: IAppContext;
  userRepo: IUserRepo;
  passwordService: IPasswordService;
  eventBus: IEventBus;
  userAuthRepo: IUserAuthRepo;
  repoService: IRepoService;
  emailVerificationService: IEmailVerificationService;
}

export default function makeSignupWithEmailUsecase(deps: IDependencies) {
  return async (payload: IUserSignupReq): Promise<void> => {
    zodValidationRunner(userSignupReqValidation, payload);

    const { correlationId, idempotencyKey } = deps.appContext.get();

    const email = emailValue.make(payload.email);

    const password = deps.passwordService.makePassword(payload.password);
    const passwordHash = await deps.passwordService.hash(password);

    const existingUser = await deps.userRepo.findByEmail(email, {
      correlationId,
    });

    if (existingUser) {
      await deps.emailVerificationService.send(existingUser, correlationId);
      return;
    }

    const [user, userEvents, userAudit] = userEntity.make({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email,
      emailVerified: false,
    });

    const history = historyValue.make(
      userAudit,
      historyValue.getUserActor(user.id),
      correlationId
    );

    const repoTransaction: TRepoTransactionFn = async (tx) => {
      await deps.userRepo.create(user, { correlationId, tx, history });
      const timestamp = new Date();

      await deps.userAuthRepo.create(
        {
          userId: user.id,
          password: passwordHash,
          failedLoginAttempts: 0,
          strategy: [EAuthStrategy.Email],
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        { correlationId, tx }
      );
    };

    await deps.repoService.runInTransaction(repoTransaction);

    const enrichedUserEvents = userEvents.map((e) =>
      eventValue.enrich(e, { correlationId, idempotencyKey })
    );

    await deps.eventBus.publish(enrichedUserEvents);

    await deps.emailVerificationService.send(user, correlationId);
  };
}
