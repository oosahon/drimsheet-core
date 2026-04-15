import IRequestContext from '../../contracts/app/request-context.contract';
import IAuthService from '../../contracts/infra/auth-service.contract';
import IUserSessionRepo from '../../contracts/repos/user-session.repo.contract';

export default function logoutUseCase(
  reqContext: IRequestContext,
  authService: IAuthService,
  userSessionRepo: IUserSessionRepo
) {
  return async () => {
    const { clientSession, correlationId } = reqContext.get();

    const refreshToken = clientSession.getRefreshToken();

    if (refreshToken) {
      try {
        const decoded = authService.verifyRefreshToken(refreshToken);
        if (decoded) {
          await userSessionRepo.delete(decoded.id, refreshToken, {
            correlationId,
          });
        }
      } catch {
        // ignore errors from verification to ensure we always clear the cookie
      }
    }

    clientSession.clearRefreshToken();
  };
}
