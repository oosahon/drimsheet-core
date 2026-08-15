import IEventBus from '@shared/contracts/event-bus.contract';
import { IRepoService } from '@shared/contracts/repo.contract';
import { ITransactionContext } from '@shared/types/repo.types';
import appError from '@shared/values/errors/app.error';

import IUserRepo from '@domain/user/repos/user.repo';

import ITokenService from '@app/auth/contracts/token-service.contract';
import IUserSessionRepo from '@app/auth/contracts/user-session.repo.contract';
import authError from '@app/auth/errors/auth.error';
import makeIssueUserSessionHelper from '@app/auth/usecases/helpers/issue-user-session.helper';
import IAppContext from '@app/context/contracts/app-context.contract';

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
    const { clientSession, correlationId } = deps.reqContext.get([
      'clientSession',
    ]);

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
