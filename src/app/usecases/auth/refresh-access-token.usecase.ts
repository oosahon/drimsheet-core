import IUserRepo from '../../../domain/user/repos/user.repo';
import { ErrorUnauthorized } from '../../../shared/value-objects/error';
import IRequestContext from '../../contracts/app/request-context.contract';
import IAuthService from '../../contracts/infra/auth-service.contract';
import IEventBus from '../../contracts/infra/event-bus.contract';
import { IRepoService } from '../../contracts/infra/repo.contract';
import IUserSessionRepo from '../../contracts/repos/user-session.repo.contract';
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
      throw new ErrorUnauthorized();
    }

    const decoded = makeAuthService.verifyRefreshToken(refreshToken);

    if (!decoded) {
      throw new ErrorUnauthorized();
    }

    const user = await userRepo.findById(decoded.id, { correlationId });

    if (!user) {
      throw new ErrorUnauthorized();
    }

    const existingRefreshToken = await userSessionRepo.findByRefreshToken(
      user.id,
      refreshToken,
      { correlationId }
    );

    if (!existingRefreshToken) {
      throw new ErrorUnauthorized();
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
