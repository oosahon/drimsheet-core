import { IUser } from '../../../domain/user/types/user.types';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import { IRepoService } from '../../../shared/contracts/repo.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import IAuthService from '../contracts/auth-service.contract';
import IUserSessionRepo from '../contracts/user-session.repo.contract';
import makeIssueUserSessionHelper from './helpers/issue-user-session.helper';

export default function makeOauthUsecase(
  reqContext: IRequestContext,
  makeAuthService: IAuthService,
  eventBus: IEventBus,
  userSessionRepo: IUserSessionRepo,
  repoService: IRepoService,
  webAppUrl: string
) {
  return {
    handleGoogleCallback: async (user: IUser): Promise<string> => {
      const { accessToken } = await makeIssueUserSessionHelper({
        user,
        reqContext,
        makeAuthService,
        userSessionRepo,
        eventBus,
        repoService,
        events: [],
      });

      return `${webAppUrl}/auth/oauth-confirmation?access_token=${accessToken}`;
    },
  };
}
