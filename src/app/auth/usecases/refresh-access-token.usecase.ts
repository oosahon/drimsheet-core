import IUserRepo from '../../../domain/user/repos/user.repo';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import { IRepoService } from '../../../shared/contracts/repo.contract';
import appError from '../../../shared/errors/app.error';
import IAppContext from '../../_internal/contracts/app-context.contract';
import ITokenService from '../contracts/token-service.contract';
import IUserSessionRepo from '../contracts/user-session.repo.contract';
import makeIssueUserSessionHelper from './helpers/issue-user-session.helper';

interface IDependencies {
  reqContext: IAppContext;
  userRepo: IUserRepo;
  tokenService: ITokenService;
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

    const decoded = deps.tokenService.verifyRefreshToken(refreshToken);

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
      tokenService: deps.tokenService,
      userSessionRepo: deps.userSessionRepo,
      eventBus: deps.eventBus,
      repoService: deps.repoService,
      events: [],
    });
  };
}
