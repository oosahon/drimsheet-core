import IEventBus from '@shared/contracts/event-bus.contract';
import { IRepoService } from '@shared/contracts/repo.contract';

import { IUser } from '@domain/user/types/user.types';

import ITokenService from '@app/auth/contracts/token-service.contract';
import IUserSessionRepo from '@app/auth/contracts/user-session.repo.contract';
import makeIssueUserSessionHelper from '@app/auth/usecases/helpers/issue-user-session.helper';
import IAppContext from '@app/context/contracts/app-context.contract';

interface IDependencies {
  reqContext: IAppContext;
  tokenService: ITokenService;
  eventBus: IEventBus;
  userSessionRepo: IUserSessionRepo;
  repoService: IRepoService;
  webAppUrl: string;
}

export default function makeOauthUsecase(deps: IDependencies) {
  return {
    handleGoogleCallback: async (user: IUser): Promise<string> => {
      await makeIssueUserSessionHelper({
        user,
        reqContext: deps.reqContext,
        tokenService: deps.tokenService,
        userSessionRepo: deps.userSessionRepo,
        eventBus: deps.eventBus,
        repoService: deps.repoService,
        events: [],
      });

      return `${deps.webAppUrl}/auth/oauth-confirmation`;
    },
  };
}
