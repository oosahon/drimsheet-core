import IUserRepo from '../../../domain/user/repos/user.repo';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import { IRepoService } from '../../../shared/contracts/repo.contract';
import { ITransactionContext } from '../../../shared/types/repo.types';
import appError from '../../../shared/values/errors/app.error';
import IAppContext from '../../context/contracts/app-context.contract';
import ITokenService from '../contracts/token-service.contract';
import IUserSessionRepo from '../contracts/user-session.repo.contract';
import authError from '../errors/auth.error';
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
      clientSession.clearRefreshToken();
      throw new appError.Unauthorized();
    }

    try {
      const decoded = deps.tokenService.verifyRefreshToken(refreshToken);

      const user = await deps.userRepo.findById(decoded.id, { correlationId });

      if (!user) {
        throw new appError.Unauthorized();
      }

      const consumePresentedSession = async (tx: ITransactionContext) => {
        const deleted = await deps.userSessionRepo.delete(
          user.id,
          refreshToken,
          { correlationId, tx }
        );

        if (!deleted) {
          throw new appError.Unauthorized();
        }
      };

      return await makeIssueUserSessionHelper({
        user,
        reqContext: deps.reqContext,
        tokenService: deps.tokenService,
        userSessionRepo: deps.userSessionRepo,
        eventBus: deps.eventBus,
        repoService: deps.repoService,
        events: [],
        beforeCreate: consumePresentedSession,
        replaceExistingClientSession: false,
      });
    } catch (error) {
      if (
        error instanceof authError.Base ||
        error instanceof appError.Unauthorized
      ) {
        clientSession.clearRefreshToken();
      }
      throw error;
    }
  };
}
