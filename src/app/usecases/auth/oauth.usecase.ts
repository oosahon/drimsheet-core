import { IUser } from '../../../domain/user/types/user.types';
import IRequestContext from '../../contracts/app/request-context.contract';
import IAuthService from '../../contracts/infra/auth-service.contract';
import IEventBus from '../../contracts/infra/event-bus.contract';
import { IRepoService } from '../../contracts/infra/repo.contract';
import IUserSessionRepo from '../../contracts/repos/user-session.repo.contract';
import issueUserSessionHelper from './helpers/issue-user-session.helper';

export default function oauthUsecase(
  reqContext: IRequestContext,
  authService: IAuthService,
  eventBus: IEventBus,
  userSessionRepo: IUserSessionRepo,
  repoService: IRepoService,
  webAppUrl: string
) {
  return {
    handleGoogleCallback: async (user: IUser): Promise<string> => {
      const { accessToken } = await issueUserSessionHelper({
        user,
        reqContext,
        authService,
        userSessionRepo,
        eventBus,
        repoService,
        events: [],
      });

      return `${webAppUrl}/auth/callback?access_token=${accessToken}`;
    },
  };
}
