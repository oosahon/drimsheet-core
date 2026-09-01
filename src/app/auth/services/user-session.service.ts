import generateUUID from '@shared/utils/uuid-generator';

import ITokenService from '@app/auth/contracts/token-service.contract';
import IUserSessionService from '@app/auth/contracts/user-session.service.contract';

interface IDependencies {
  tokenService: ITokenService;
}

/**
 * Creates the capability that prepares credentials, an immutable session
 * record, and an optional prior-client reference without persisting them.
 */
function makePrepare(deps: IDependencies): IUserSessionService['prepare'] {
  return async (user, priorClientRefreshToken = null) => {
    const accessToken = await deps.tokenService.generateAccessToken(user);
    const refreshToken = await deps.tokenService.generateRefreshToken(user);
    const timestamp = new Date();

    let priorClientSession = null;
    if (priorClientRefreshToken) {
      let priorUserId = user.id;

      try {
        priorUserId = deps.tokenService.verifyRefreshToken(
          priorClientRefreshToken
        ).id;
      } catch {
        // The current user's ID preserves cleanup for an unparseable token.
      }

      priorClientSession = Object.freeze({
        userId: priorUserId,
        refreshToken: priorClientRefreshToken,
      });
    }

    const userSession = Object.freeze({
      id: generateUUID(),
      userId: user.id,
      refreshToken,
      lastLoginAt: timestamp,
      createdAt: timestamp,
    });

    return Object.freeze({
      accessToken,
      refreshToken,
      userSession,
      priorClientSession,
    });
  };
}

/** Composes the immutable user-session service from its capability. */
export default function makeUserSessionService(deps: IDependencies) {
  const service: IUserSessionService = {
    prepare: makePrepare(deps),
  };

  return Object.freeze(service);
}
