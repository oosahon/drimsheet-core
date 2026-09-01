import appError from '@shared/values/errors/app.error';

import IUserRepo from '@domain/user/repos/user.repo';

import ITokenService from '@app/auth/contracts/token-service.contract';
import IUserSessionPersistenceService from '@app/auth/contracts/user-session-persistence.service.contract';
import IUserSessionService from '@app/auth/contracts/user-session.service.contract';
import authError from '@app/auth/errors/auth.error';
import IAppContext from '@app/context/contracts/app-context.contract';

interface IDependencies {
  reqContext: IAppContext;
  userRepo: IUserRepo;
  tokenService: ITokenService;
  userSessionService: IUserSessionService;
  userSessionPersistenceService: IUserSessionPersistenceService;
}

export default function makeRefreshAccessTokenUseCase(deps: IDependencies) {
  return async () => {
    const { clientSession, correlationId } = deps.reqContext.get([
      'clientSession',
    ]);

    const refreshToken = clientSession.getRefreshToken();

    if (!refreshToken) {
      clientSession.clearRefreshToken();
      throw new appError.Unauthorized();
    }

    try {
      const decoded = deps.tokenService.verifyRefreshToken(refreshToken);

      const user = await deps.userRepo.findById(decoded.id, { correlationId });

      if (!user) {
        throw new appError.Unauthorized();
      }

      const preparedSession = await deps.userSessionService.prepare(user);
      const wasRotated = await deps.userSessionPersistenceService.rotateSession(
        {
          userSession: preparedSession.userSession,
          presentedSession: { userId: user.id, refreshToken },
        },
        { correlationId }
      );

      if (!wasRotated) {
        throw new appError.Unauthorized();
      }

      clientSession.setRefreshToken(preparedSession.refreshToken);

      return { accessToken: preparedSession.accessToken };
    } catch (error) {
      if (
        error instanceof authError.Base ||
        error instanceof appError.Unauthorized
      ) {
        clientSession.clearRefreshToken();
      }
      throw error;
    }
  };
}
