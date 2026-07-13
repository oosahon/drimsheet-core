import { IUser } from '../../../domain/user/types/user.types';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import { IRepoService } from '../../../shared/contracts/repo.contract';
import IAppContext from '../../_internal/contracts/app-context.contract';
import IAuthService from '../contracts/auth-service.contract';
import IUserSessionRepo from '../contracts/user-session.repo.contract';
import makeIssueUserSessionHelper from './helpers/issue-user-session.helper';

interface IDependencies {
  reqContext: IAppContext;
  authService: IAuthService;
  eventBus: IEventBus;
  userSessionRepo: IUserSessionRepo;
  repoService: IRepoService;
  webAppUrl: string;
}

export default function makeOauthUsecase(deps: IDependencies) {
  return {
    handleGoogleCallback: async (user: IUser): Promise<string> => {
      const { accessToken } = await makeIssueUserSessionHelper({
        user,
        reqContext: deps.reqContext,
        authService: deps.authService,
        userSessionRepo: deps.userSessionRepo,
        eventBus: deps.eventBus,
        repoService: deps.repoService,
        events: [],
      });

      return `${deps.webAppUrl}/auth/oauth-confirmation?access_token=${accessToken}`;
    },
  };
}
