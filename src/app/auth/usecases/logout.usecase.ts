import IAppContext from '../../context/contracts/app-context.contract';
import ITokenService from '../contracts/token-service.contract';
import IUserSessionRepo from '../contracts/user-session.repo.contract';
import authError from '../errors/auth.error';

interface IDependencies {
  reqContext: IAppContext;
  tokenService: ITokenService;
  userSessionRepo: IUserSessionRepo;
}

export default function makeLogoutUseCase(deps: IDependencies) {
  return async () => {
    const { clientSession, correlationId } = deps.reqContext.get();

    const refreshToken = clientSession.getRefreshToken();

    if (!refreshToken) {
      clientSession.clearRefreshToken();
      return;
    }

    let decoded;

    try {
      decoded = deps.tokenService.verifyRefreshToken(refreshToken);
    } catch (error) {
      if (!(error instanceof authError.Base)) {
        throw error;
      }

      clientSession.clearRefreshToken();
      return;
    }

    await deps.userSessionRepo.delete(decoded.id, refreshToken, {
      correlationId,
    });

    clientSession.clearRefreshToken();
  };
}
