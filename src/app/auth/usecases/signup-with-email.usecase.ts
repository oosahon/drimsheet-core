import IEventBus from '@shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '@shared/contracts/repo.contract';
import zodValidationRunner from '@shared/utils/zod-validation-runner';
import eventValue from '@shared/values/events/event.vo';
import historyValue from '@shared/values/history/history.vo';

import userEntity from '@domain/user/entities/user.entity';
import IUserRepo from '@domain/user/repos/user.repo';
import emailValue from '@domain/user/values/email.vo';

import { EAuthStrategy } from '@app/auth/contracts/auth.types';
import IEmailVerificationService from '@app/auth/contracts/email-verification-service.contract';
import IPasswordService from '@app/auth/contracts/password-service.contract';
import IUserAuthRepo from '@app/auth/contracts/user-auth.repo.contract';
import IUserAuthService from '@app/auth/contracts/user-auth.service.contract';
import { IUserSignupReq } from '@app/auth/dtos/auth/auth.dto';
import { userSignupReqValidation } from '@app/auth/dtos/auth/auth.dto.validation';
import IAppContext from '@app/context/contracts/app-context.contract';

interface IDependencies {
  appContext: IAppContext;
  userRepo: IUserRepo;
  passwordService: IPasswordService;
  eventBus: IEventBus;
  userAuthRepo: IUserAuthRepo;
  userAuthService: IUserAuthService;
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

    const userAuth = deps.userAuthService.make({
      userId: user.id,
      password: passwordHash,
      strategy: EAuthStrategy.Email,
    });

    const repoTransaction: TRepoTransactionFn = async (tx) => {
      await deps.userRepo.create(user, { correlationId, tx, history });
      await deps.userAuthRepo.create(userAuth, { correlationId, tx });
    };

    await deps.repoService.runInTransaction(repoTransaction);

    const enrichedUserEvents = userEvents.map((e) =>
      eventValue.enrich(e, { correlationId, idempotencyKey })
    );

    await deps.eventBus.publish(enrichedUserEvents);

    await deps.emailVerificationService.send(user, correlationId);
  };
}
