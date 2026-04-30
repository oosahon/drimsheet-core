import IRequestContext from '../../contracts/app/request-context.contract';
import IAuthService from '../../contracts/infra/auth-service.contract';
import ILogger from '../../contracts/infra/logger.contract';
import IUserSessionRepo from '../../contracts/repos/user-session.repo.contract';

export default function makeLogoutUseCase(
  reqContext: IRequestContext,
  makeAuthService: IAuthService,
  userSessionRepo: IUserSessionRepo,
  logger: ILogger
) {
  return async () => {
    const { clientSession, correlationId } = reqContext.get();

    const refreshToken = clientSession.getRefreshToken();

    if (refreshToken) {
      try {
        const decoded = makeAuthService.verifyRefreshToken(refreshToken);
        await userSessionRepo.delete(decoded.id, refreshToken, {
          correlationId,
        });
      } catch (error) {
        logger.error(error as Error);
      }
    }

    clientSession.clearRefreshToken();
  };
}
