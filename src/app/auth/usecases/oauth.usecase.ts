import { IUser } from '../../../domain/user/types/user.types';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import { IRepoService } from '../../../shared/contracts/repo.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import IAuthService from '../contracts/auth-service.contract';
import IUserSessionRepo from '../contracts/user-session.repo.contract';
import makeIssueUserSessionHelper from './helpers/issue-user-session.helper';

interface IDependencies {
  reqContext: IRequestContext;
  makeAuthService: IAuthService;
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
        makeAuthService: deps.makeAuthService,
        userSessionRepo: deps.userSessionRepo,
        eventBus: deps.eventBus,
        repoService: deps.repoService,
        events: [],
      });

      return `${deps.webAppUrl}/auth/oauth-confirmation?access_token=${accessToken}`;
    },
  };
}
