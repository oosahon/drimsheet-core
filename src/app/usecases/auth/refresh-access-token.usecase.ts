import IUserRepo from '../../../domain/user/repos/user.repo';
import IRequestContext from '../../contracts/app/request-context.contract';
import IAuthService from '../../contracts/infra/auth-service.contract';
import IEventBus from '../../contracts/infra/event-bus.contract';
import { IRepoService } from '../../contracts/infra/repo.contract';
import IUserSessionRepo from '../../contracts/repos/user-session.repo.contract';
import httpError from '../../errors/http.errors';
import makeIssueUserSessionHelper from './helpers/issue-user-session.helper';

export default function makeRefreshAccessTokenUseCase(
  reqContext: IRequestContext,
  userRepo: IUserRepo,
  makeAuthService: IAuthService,
  eventBus: IEventBus,
  userSessionRepo: IUserSessionRepo,
  repoService: IRepoService
) {
  return async () => {
    const { clientSession, correlationId } = reqContext.get();

    const refreshToken = clientSession.getRefreshToken();

    if (!refreshToken) {
      throw new httpError.Unauthorized();
    }

    const decoded = makeAuthService.verifyRefreshToken(refreshToken);

    const user = await userRepo.findById(decoded.id, { correlationId });

    if (!user) {
      throw new httpError.Unauthorized();
    }

    const existingRefreshToken = await userSessionRepo.findByRefreshToken(
      user.id,
      refreshToken,
      { correlationId }
    );

    if (!existingRefreshToken) {
      throw new httpError.Unauthorized();
    }

    return makeIssueUserSessionHelper({
      user,
      reqContext,
      makeAuthService,
      userSessionRepo,
      eventBus,
      repoService,
      events: [],
    });
  };
}
