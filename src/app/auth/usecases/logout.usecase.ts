import ILogger from '../../../shared/contracts/logger.contract';
import IAppContext from '../../_internal/contracts/app-context.contract';
import ITokenService from '../contracts/token-service.contract';
import IUserSessionRepo from '../contracts/user-session.repo.contract';

interface IDependencies {
  reqContext: IAppContext;
  tokenService: ITokenService;
  userSessionRepo: IUserSessionRepo;
  logger: ILogger;
}

export default function makeLogoutUseCase(deps: IDependencies) {
  return async () => {
    const { clientSession, correlationId } = deps.reqContext.get();

    const refreshToken = clientSession.getRefreshToken();

    if (refreshToken) {
      try {
        const decoded = deps.tokenService.verifyRefreshToken(refreshToken);
        await deps.userSessionRepo.delete(decoded.id, refreshToken, {
          correlationId,
        });
      } catch (error) {
        deps.logger.error(error as Error);
      }
    }

    clientSession.clearRefreshToken();
  };
}
