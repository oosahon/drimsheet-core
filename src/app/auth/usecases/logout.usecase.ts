import IUserSessionRepo from '../../auth/contracts/user-session.repo.contract';
import ILogger from '../../shared/contracts/logger.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import IAuthService from '../contracts/auth-service.contract';

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
