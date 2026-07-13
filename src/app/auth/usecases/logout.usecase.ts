import IAppContext from '../../../shared/contracts/app-context.contract';
import ILogger from '../../../shared/contracts/logger.contract';
import IAuthService from '../contracts/auth-service.contract';
import IUserSessionRepo from '../contracts/user-session.repo.contract';

interface IDependencies {
  reqContext: IAppContext;
  authService: IAuthService;
  userSessionRepo: IUserSessionRepo;
  logger: ILogger;
}

export default function makeLogoutUseCase(deps: IDependencies) {
  return async () => {
    const { clientSession, correlationId } = deps.reqContext.get();

    const refreshToken = clientSession.getRefreshToken();

    if (refreshToken) {
      try {
        const decoded = deps.authService.verifyRefreshToken(refreshToken);
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
