import IEventBus from '@shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '@shared/contracts/repo.contract';
import appError from '@shared/values/errors/app.error';
import eventValue from '@shared/values/events/event.vo';
import historyValue from '@shared/values/history/history.vo';

import userEntity from '@domain/user/entities/user.entity';
import IUserRepo from '@domain/user/repos/user.repo';
import emailValue from '@domain/user/values/email.vo';

import { EAuthStrategy } from '@app/auth/contracts/auth.types';
import IUserAuthRepo from '@app/auth/contracts/user-auth.repo.contract';
import IUserAuthService from '@app/auth/contracts/user-auth.service.contract';
import {
  IOAuthProfile,
  TOAuthDoneCallback,
} from '@app/auth/dtos/auth/auth.dto';
import authError from '@app/auth/errors/auth.error';
import IAppContext from '@app/context/contracts/app-context.contract';

interface IDependencies {
  eventBus: IEventBus;
  appContext: IAppContext;
  userRepo: IUserRepo;
  userAuthRepo: IUserAuthRepo;
  userAuthService: IUserAuthService;
  repoService: IRepoService;
}

export default function makeLoginWithGoogleUseCase(deps: IDependencies) {
  return async (profile: IOAuthProfile, done: TOAuthDoneCallback) => {
    try {
      if (
        !profile.providerSubject ||
        !profile.email ||
        !profile.emailVerified
      ) {
        const error = new appError.BadRequest();
        return done(error, false);
      }

      const { correlationId, idempotencyKey } = deps.appContext.get();

      const email = emailValue.normalize(profile.email);
      const existingUser = await deps.userRepo.findByEmail(email, {
        correlationId,
      });

      if (existingUser) {
        await deps.repoService.runInTransaction(async (tx) => {
          const userAuth = await deps.userAuthRepo.findByUserId(
            existingUser.id,
            {
              correlationId,
              tx,
            }
          );

          if (!userAuth) {
            throw new authError.InconsistentUserAuth();
          }

          if (!userAuth.strategy.includes(EAuthStrategy.Google)) {
            const updatedUserAuth = deps.userAuthService.addStrategy(
              userAuth,
              EAuthStrategy.Google
            );

            await deps.userAuthRepo.update(updatedUserAuth, {
              correlationId,
              expectedVersion: userAuth.version,
              tx,
            });
          }
        });

        return done(null, existingUser);
      }

      const [user, userEvents, userAuditDelta] = userEntity.make({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email,
        emailVerified: true,
      });

      const history = historyValue.make(
        userAuditDelta,
        historyValue.getUserActor(user.id),
        correlationId
      );

      const userAuth = deps.userAuthService.make({
        userId: user.id,
        password: null,
        strategy: EAuthStrategy.Google,
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

      return done(null, user);
    } catch (error) {
      if (error instanceof Error) {
        return done(error, false);
      }
      return done(new appError.InternalServerError(), false);
    }
  };
}
