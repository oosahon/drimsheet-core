import IActorService from '@domain/user/types/actor.service.types';
import { IUser } from '@domain/user/types/user.types';

import IUserSessionPersistenceService from '@app/auth/contracts/user-session-persistence.service.contract';
import IUserSessionService from '@app/auth/contracts/user-session.service.contract';
import IAppContext from '@app/context/contracts/app-context.contract';

interface IDependencies {
  actorService: IActorService;
  reqContext: IAppContext;
  userSessionService: IUserSessionService;
  userSessionPersistenceService: IUserSessionPersistenceService;
  webAppUrl: string;
}

export default function makeOauthUsecase(deps: IDependencies) {
  return {
    handleGoogleCallback: async (user: IUser): Promise<string> => {
      const { correlationId, clientSession } = deps.reqContext.get([
        'clientSession',
      ]);
      await deps.actorService.resolveUser(user, { correlationId });
      const preparedSession = await deps.userSessionService.prepare(
        user,
        clientSession.getRefreshToken()
      );

      await deps.userSessionPersistenceService.replaceClientSession(
        {
          userSession: preparedSession.userSession,
          priorClientSession: preparedSession.priorClientSession,
        },
        { correlationId }
      );

      clientSession.setRefreshToken(preparedSession.refreshToken);

      return `${deps.webAppUrl}/auth/oauth-confirmation`;
    },
  };
}
