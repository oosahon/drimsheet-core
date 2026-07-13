import { z } from 'zod';
import userEntity from '../../../domain/user/entities/user.entity';
import IUserRepo from '../../../domain/user/repos/user.repo';
import IAppContext from '../../../shared/contracts/app-context.contract';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import { IRepoService } from '../../../shared/contracts/repo.contract';
import eventValue from '../../../shared/events/event.vo';
import historyValue from '../../../shared/history/history.vo';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import IAuthService from '../contracts/auth-service.contract';
import IUserSessionRepo from '../contracts/user-session.repo.contract';
import { IAccessToken } from '../dtos/auth/auth.dto';
import authError from '../errors/auth.error';
import makeIssueUserSessionHelper from './helpers/issue-user-session.helper';

const validationSchema = z.object({
  token: z.string(),
});

interface IDependencies {
  makeAuthService: IAuthService;
  userRepo: IUserRepo;
  appContext: IAppContext;
  eventBus: IEventBus;
  userSessionRepo: IUserSessionRepo;
  repoService: IRepoService;
}

export default function makeVerifyEmailAddressUseCase(deps: IDependencies) {
  return async (token: string): Promise<IAccessToken> => {
    zodValidationRunner(validationSchema, { token });

    const { correlationId } = deps.appContext.get();

    const decodedToken = await deps.makeAuthService.verifySignupToken(token);

    const user = await deps.userRepo.findById(decodedToken.id, {
      correlationId,
    });

    if (!user) {
      throw new authError.InvalidToken();
    }

    if (user.emailVerified) {
      return makeIssueUserSessionHelper({
        user,
        reqContext: deps.appContext,
        makeAuthService: deps.makeAuthService,
        userSessionRepo: deps.userSessionRepo,
        eventBus: deps.eventBus,
        repoService: deps.repoService,
        events: [],
      });
    }

    const [updatedUser, events, userAuditDelta] = userEntity.verifyEmail(user);

    const history = historyValue.make(
      userAuditDelta!,
      historyValue.getUserActor(user.id),
      correlationId
    );

    await deps.userRepo.update(updatedUser, { correlationId, history });

    return makeIssueUserSessionHelper({
      user: updatedUser,
      reqContext: deps.appContext,
      makeAuthService: deps.makeAuthService,
      userSessionRepo: deps.userSessionRepo,
      eventBus: deps.eventBus,
      repoService: deps.repoService,
      events: eventValue.enrichAll(events, { correlationId }),
    });
  };
}
