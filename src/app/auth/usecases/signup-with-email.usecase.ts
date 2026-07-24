import userEntity from '../../../domain/user/entities/user.entity';
import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/values/email.vo';
import passwordValue from '../../../domain/user/values/password.vo';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import appError from '../../../shared/errors/app.error';
import eventValue from '../../../shared/events/event.vo';
import historyValue from '../../../shared/history/history.vo';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import IAppContext from '../../_internal/contracts/app-context.contract';
import IAuthService, {
  EAuthStrategy,
} from '../contracts/auth-service.contract';
import IUserAuthRepo from '../contracts/user-auth.repo.contract';
import { IUserSignupReq } from '../dtos/auth/auth.dto';
import { userSignupReqValidation } from '../dtos/auth/auth.dto.validation';

interface IDependencies {
  appContext: IAppContext;
  userRepo: IUserRepo;
  authService: IAuthService;
  eventBus: IEventBus;
  userAuthRepo: IUserAuthRepo;
  repoService: IRepoService;
}

export default function makeSignupWithEmailUsecase(deps: IDependencies) {
  return async (payload: IUserSignupReq) => {
    zodValidationRunner(userSignupReqValidation, payload);

    const { correlationId, idempotencyKey } = deps.appContext.get();

    const email = emailValue.make(payload.email);

    const isPermittedEmail = deps.authService.isPermittedEmail(email);

    if (!isPermittedEmail) {
      throw new appError.Forbidden();
    }

    const existingUser = await deps.userRepo.findByEmail(email, {
      correlationId,
    });

    if (existingUser) {
      throw new appError.Conflict();
    }

    const password = passwordValue.make(payload.password);
    const passwordHash = await deps.authService.hashPassword(password);

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

    deps.eventBus.publish(enrichedUserEvents);
  };
}
