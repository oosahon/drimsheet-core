import userEntity from '../../../domain/user/entities/user.entity';
import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/values/email.vo';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import { ERepoLock } from '../../../shared/types/repo.types';
import appError from '../../../shared/values/errors/app.error';
import eventValue from '../../../shared/values/events/event.vo';
import historyValue from '../../../shared/values/history/history.vo';
import IAppContext from '../../context/contracts/app-context.contract';
import { EAuthStrategy } from '../contracts/auth.types';
import IUserAuthRepo from '../contracts/user-auth.repo.contract';
import { IOAuthProfile, TOAuthDoneCallback } from '../dtos/auth/auth.dto';
import authError from '../errors/auth.error';

export default function makeLoginWithGoogleUseCase(
  eventBus: IEventBus,
  appContext: IAppContext,
  userRepo: IUserRepo,
  userAuthRepo: IUserAuthRepo,
  repoService: IRepoService
) {
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

      const { correlationId, idempotencyKey } = appContext.get();

      const email = emailValue.normalize(profile.email);
      const existingUser = await userRepo.findByEmail(email, { correlationId });

      if (existingUser) {
        await repoService.runInTransaction(async (tx) => {
          const userAuth = await userAuthRepo.findByUserId(existingUser.id, {
            correlationId,
            tx,
            lock: ERepoLock.Update,
          });

          if (!userAuth) {
            throw new authError.InconsistentUserAuth();
          }

          if (!userAuth.strategy.includes(EAuthStrategy.Google)) {
            await userAuthRepo.update(
              {
                ...userAuth,
                strategy: [...userAuth.strategy, EAuthStrategy.Google],
              },
              { correlationId, tx }
            );
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

      const repoTransaction: TRepoTransactionFn = async (tx) => {
        await userRepo.create(user, { correlationId, tx, history });
        const timestamp = new Date();

        await userAuthRepo.create(
          {
            userId: user.id,
            password: null,
            failedLoginAttempts: 0,
            strategy: [EAuthStrategy.Google],
            createdAt: timestamp,
            updatedAt: timestamp,
          },
          { correlationId, tx }
        );
      };

      await repoService.runInTransaction(repoTransaction);

      const enrichedUserEvents = userEvents.map((e) =>
        eventValue.enrich(e, { correlationId, idempotencyKey })
      );

      await eventBus.publish(enrichedUserEvents);

      return done(null, user);
    } catch (error) {
      if (error instanceof Error) {
        return done(error, false);
      }
      return done(new appError.InternalServerError(), false);
    }
  };
}
