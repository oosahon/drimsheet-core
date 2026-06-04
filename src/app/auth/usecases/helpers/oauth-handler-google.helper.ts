import userEntity from '../../../../domain/user/entities/user.entity';
import IUserRepo from '../../../../domain/user/repos/user.repo';
import emailValue from '../../../../domain/user/value-objects/email.vo';
import eventValue from '../../../../shared/value-objects/event.vo';
import IUserAuthRepo from '../../../auth/contracts/user-auth.repo.contract';
import { IOAuthProfile, TOAuthDoneCallback } from '../../../auth/dtos/auth.dto';
import { EAuthStrategy } from '../../../shared/contracts/auth-service.contract';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import IRequestContext from '../../../shared/contracts/request-context.contract';
import appError from '../../../shared/errors/app.error';

export default function makeGoogleOAuthHelper(
  eventBus: IEventBus,
  requestContext: IRequestContext,
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

      const { correlationId, idempotencyKey } = requestContext.get();

      const email = emailValue.normalize(profile.email);
      const existingUser = await userRepo.findByEmail(email, { correlationId });

      if (existingUser) {
        const userAuth = await userAuthRepo.findByUserId(existingUser.id, {
          correlationId,
        });

        if (userAuth && !userAuth.strategy.includes(EAuthStrategy.Google)) {
          userAuth.strategy.push(EAuthStrategy.Google);
          await userAuthRepo.save(userAuth, { correlationId });
        }

        return done(null, existingUser);
      }

      const [user, userEvents] = userEntity.make({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email,
        emailVerified: true,
      });

      const repoTransaction: TRepoTransactionFn = async (tx) => {
        await userRepo.save(user, { correlationId, tx });
        const timestamp = new Date();

        await userAuthRepo.save(
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
