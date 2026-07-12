import IUserRepo from '../../../domain/user/repos/user.repo';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import { IRepoService } from '../../../shared/contracts/repo.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import appError from '../../shared/errors/app.error';
import IAuthService from '../contracts/auth-service.contract';
import IUserSessionRepo from '../contracts/user-session.repo.contract';
import makeIssueUserSessionHelper from './helpers/issue-user-session.helper';

interface IDependencies {
  reqContext: IRequestContext;
  userRepo: IUserRepo;
  makeAuthService: IAuthService;
  eventBus: IEventBus;
  userSessionRepo: IUserSessionRepo;
  repoService: IRepoService;
}

export default function makeRefreshAccessTokenUseCase(deps: IDependencies) {
  return async () => {
    const { clientSession, correlationId } = deps.reqContext.get();

    const refreshToken = clientSession.getRefreshToken();

    if (!refreshToken) {
      throw new appError.Unauthorized();
    }

    const decoded = deps.makeAuthService.verifyRefreshToken(refreshToken);

    const user = await deps.userRepo.findById(decoded.id, { correlationId });

    if (!user) {
      throw new appError.Unauthorized();
    }

    const existingRefreshToken = await deps.userSessionRepo.findByRefreshToken(
      user.id,
      refreshToken,
      { correlationId }
    );

    if (!existingRefreshToken) {
      throw new appError.Unauthorized();
    }

    return makeIssueUserSessionHelper({
      user,
      reqContext: deps.reqContext,
      makeAuthService: deps.makeAuthService,
      userSessionRepo: deps.userSessionRepo,
      eventBus: deps.eventBus,
      repoService: deps.repoService,
      events: [],
    });
  };
}
