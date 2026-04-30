import { z } from 'zod';
import userEntity from '../../../domain/user/entities/user.entity';
import IUserRepo from '../../../domain/user/repos/user.repo';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import IRequestContext from '../../contracts/app/request-context.contract';
import { IAccessToken } from '../../contracts/dto/auth.dto';
import IAuthService from '../../contracts/infra/auth-service.contract';
import IEventBus from '../../contracts/infra/event-bus.contract';
import { IRepoService } from '../../contracts/infra/repo.contract';
import IUserSessionRepo from '../../contracts/repos/user-session.repo.contract';
import authError from '../../errors/auth.errors';
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

    const [updatedUser, events] = userEntity.verifyEmail(user);

    await userRepo.save(updatedUser, { correlationId });

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
