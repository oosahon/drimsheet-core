import userEntity from '../../../../domain/user/entities/user.entity';
import IUserRepo from '../../../../domain/user/repos/user.repo';
import emailValue from '../../../../domain/user/values/email.vo';
import IEventBus from '../../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../../shared/contracts/repo.contract';
import appError from '../../../../shared/errors/app.error';
import eventValue from '../../../../shared/events/event.vo';
import historyValue from '../../../../shared/history/history.vo';
import IAppContext from '../../../_internal/contracts/app-context.contract';
import { EAuthStrategy } from '../../contracts/auth.types';
import IUserAuthRepo from '../../contracts/user-auth.repo.contract';
import { IOAuthProfile, TOAuthDoneCallback } from '../../dtos/auth/auth.dto';

export default function makeGoogleOAuthHelper(
  eventBus: IEventBus,
  appContext: IAppContext,
  userRepo: IUserRepo,
  userAuthRepo: IUserAuthRepo,
  repoService: IRepoService
) {
  return async (profile: IOAuthProfile, done: TOAuthDoneCallback) => {
    try {
      if (!profile.email) {
        const error = new appError.BadRequest();
        return done(error, false);
      }

      const { correlationId, idempotencyKey } = appContext.get();

      const email = emailValue.normalize(profile.email);
      const existingUser = await userRepo.findByEmail(email, { correlationId });

      if (existingUser) {
        const userAuth = await userAuthRepo.findByUserId(existingUser.id, {
          correlationId,
        });

        if (userAuth && !userAuth.strategy.includes(EAuthStrategy.Google)) {
          userAuth.strategy.push(EAuthStrategy.Google);
          await userAuthRepo.update(userAuth, { correlationId });
        }

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

      eventBus.publish(enrichedUserEvents);

      return done(null, user);
    } catch (error) {
      if (error instanceof Error) {
        return done(error, false);
      }
      return done(new appError.InternalServerError(), false);
    }
  };
}
