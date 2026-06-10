import IUserRepo from '../../../domain/user/repos/user.repo';
import IUserSessionRepo from '../../auth/contracts/user-session.repo.contract';
import IEventBus from '../../shared/contracts/event-bus.contract';
import { IRepoService } from '../../shared/contracts/repo.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import appError from '../../shared/errors/app.error';
import IAuthService from '../contracts/auth-service.contract';
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
      throw new appError.Unauthorized();
    }

    const decoded = makeAuthService.verifyRefreshToken(refreshToken);

    const user = await userRepo.findById(decoded.id, { correlationId });

    if (!user) {
      throw new appError.Unauthorized();
    }

    const existingRefreshToken = await userSessionRepo.findByRefreshToken(
      user.id,
      refreshToken,
      { correlationId }
    );

    if (!existingRefreshToken) {
      throw new appError.Unauthorized();
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
