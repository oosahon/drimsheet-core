import { z } from 'zod';

import IEventBus from '@shared/contracts/event-bus.contract';
import { IRepoService } from '@shared/contracts/repo.contract';
import zodValidationRunner from '@shared/utils/zod-validation-runner';
import eventValue from '@shared/values/events/event.vo';
import historyValue from '@shared/values/history/history.vo';

import userEntity from '@domain/user/entities/user.entity';
import IUserRepo from '@domain/user/repos/user.repo';
import IActorService from '@domain/user/types/actor.service.types';

import ITokenService, {
  IAuthTokenPayload,
} from '@app/auth/contracts/token-service.contract';
import IUserSessionPersistenceService from '@app/auth/contracts/user-session-persistence.service.contract';
import IUserSessionService, {
  IPreparedUserSession,
} from '@app/auth/contracts/user-session.service.contract';
import { IAccessToken } from '@app/auth/dtos/auth/auth.dto';
import authError from '@app/auth/errors/auth.error';
import IAppContext from '@app/context/contracts/app-context.contract';

const validationSchema = z.object({
  token: z.string(),
});

interface IDependencies {
  actorService: IActorService;
  tokenService: ITokenService;
  userRepo: IUserRepo;
  appContext: IAppContext;
  eventBus: IEventBus;
  userSessionService: IUserSessionService;
  userSessionPersistenceService: IUserSessionPersistenceService;
  repoService: IRepoService;
}

export default function makeVerifyEmailAddressUseCase(deps: IDependencies) {
  return async (token: string): Promise<IAccessToken> => {
    zodValidationRunner(validationSchema, { token });

    const { correlationId, clientSession } = deps.appContext.get([
      'clientSession',
    ]);

    let decodedToken: IAuthTokenPayload | undefined;

    try {
      decodedToken = await deps.tokenService.claimSignupToken(token);

      let preparedSession!: IPreparedUserSession;
      let eventsToPublish = eventValue.enrichAll([], { correlationId });

      await deps.repoService.runInTransaction(async (tx) => {
        const user = await deps.userRepo.findById(decodedToken!.id, {
          correlationId,
          tx,
        });

        if (!user) {
          throw new authError.InvalidToken();
        }

        await deps.actorService.resolveUser(user, { correlationId, tx });

        let sessionUser = user;

        if (!user.emailVerified) {
          const [updatedUser, events, userAuditDelta] =
            userEntity.verifyEmail(user);

          const history = historyValue.make(
            userAuditDelta!,
            user.actorId,
            correlationId
          );

          await deps.userRepo.update(updatedUser, {
            correlationId,
            expectedVersion: user.version,
            history,
            tx,
          });

          sessionUser = updatedUser;
          eventsToPublish = eventValue.enrichAll(events, { correlationId });
        }

        preparedSession = await deps.userSessionService.prepare(
          sessionUser,
          clientSession.getRefreshToken()
        );
        await deps.userSessionPersistenceService.replaceClientSession(
          {
            userSession: preparedSession.userSession,
            priorClientSession: preparedSession.priorClientSession,
          },
          { correlationId, tx }
        );
      });

      clientSession.setRefreshToken(preparedSession.refreshToken);
      if (eventsToPublish.length > 0) {
        await deps.eventBus.publish(eventsToPublish);
      }
      await deps.tokenService.finalizeSignupToken(decodedToken.id);

      return { accessToken: preparedSession.accessToken };
    } catch (error) {
      if (decodedToken?.id) {
        await deps.tokenService.releaseSignupTokenClaim(decodedToken.id);
      }
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        (error.name === 'AuthError' || error.name === 'UserError')
      ) {
        throw new authError.InvalidToken();
      }
      throw error;
    }
  };
}
