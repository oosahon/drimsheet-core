import { z } from 'zod';
import userEntity from '../../../domain/user/entities/user.entity';
import IUserRepo from '../../../domain/user/repos/user.repo';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import { IRepoService } from '../../../shared/contracts/repo.contract';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import historyValue from '../../../shared/value-objects/history.vo';
import IUserSessionRepo from '../../auth/contracts/user-session.repo.contract';
import { IAccessToken } from '../../auth/dtos/auth.dto';
import authError from '../../auth/errors/auth.error';
import IRequestContext from '../../shared/contracts/request-context.contract';
import IAuthService from '../contracts/auth-service.contract';
import makeIssueUserSessionHelper from './helpers/issue-user-session.helper';

const validationSchema = z.object({
  token: z.string(),
});

export default function makeVerifyEmailAddressUseCase(
  makeAuthService: IAuthService,
  userRepo: IUserRepo,
  requestContext: IRequestContext,
  eventBus: IEventBus,
  userSessionRepo: IUserSessionRepo,
  repoService: IRepoService
) {
  return async (token: string): Promise<IAccessToken> => {
    zodValidationRunner(validationSchema, { token });

    const { correlationId } = requestContext.get();

    const decodedToken = await makeAuthService.verifySignupToken(token);

    const user = await userRepo.findById(decodedToken.id, { correlationId });

    if (!user) {
      throw new authError.InvalidToken();
    }

    if (user.emailVerified) {
      return makeIssueUserSessionHelper({
        user,
        reqContext: requestContext,
        makeAuthService,
        userSessionRepo,
        eventBus,
        repoService,
        events: [],
      });
    }

    const [updatedUser, events, userAuditDelta] = userEntity.verifyEmail(user);

    const history = historyValue.make(
      userAuditDelta!,
      historyValue.getUserActor(user.id),
      correlationId
    );

    await userRepo.update(updatedUser, { correlationId, history });

    return makeIssueUserSessionHelper({
      user: updatedUser,
      reqContext: requestContext,
      makeAuthService,
      userSessionRepo,
      eventBus,
      repoService,
      events: eventValue.enrichAll(events, { correlationId }),
    });
  };
}
