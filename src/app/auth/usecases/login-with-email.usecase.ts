import z from 'zod';
import userEvents from '../../../domain/user/events/user.events';
import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/value-objects/email.vo';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import IUserAuthRepo from '../../auth/contracts/user-auth.repo.contract';
import IUserSessionRepo from '../../auth/contracts/user-session.repo.contract';
import { IAccessToken, IEmailLoginReq } from '../../auth/dtos/auth.dto';
import authError from '../../auth/errors/auth.error';
import IEventBus from '../../shared/contracts/event-bus.contract';
import { IRepoService } from '../../shared/contracts/repo.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import IAuthService, {
  EAuthStrategy,
} from '../contracts/auth-service.contract';
import makeIssueUserSessionHelper from './helpers/issue-user-session.helper';

const validationSchema = z.object({
  email: z.email({ message: 'Email is required' }),
  password: z
    .string({ message: 'Password is required' })
    .max(100, { message: 'Password must be at most 100 characters' }),
});

export default function makeLoginWithEmailUseCase(
  reqContext: IRequestContext,
  userRepo: IUserRepo,
  makeAuthService: IAuthService,
  eventBus: IEventBus,
  userAuthRepo: IUserAuthRepo,
  userSessionRepo: IUserSessionRepo,
  repoService: IRepoService
) {
  return async (payload: IEmailLoginReq): Promise<IAccessToken> => {
    zodValidationRunner(validationSchema, payload);

    const { correlationId } = reqContext.get();

    const email = emailValue.normalize(payload.email);

    const user = await userRepo.findByEmail(email, { correlationId });

    if (!user) {
      throw new authError.InvalidCredentials();
    }

    const userAuth = await userAuthRepo.findByUserId(user.id, {
      correlationId,
    });

    if (!userAuth) {
      throw new authError.InvalidCredentials();
    }

    const MAX_LOGIN_ATTEMPTS = 5;

    if (userAuth.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      throw new authError.AccountLocked();
    }

    if (
      !userAuth.strategy.includes(EAuthStrategy.Email) ||
      !userAuth.password
    ) {
      await userAuthRepo.incrementFailedLoginAttempts(user.id, {
        correlationId,
      });
      throw new authError.WrongStrategy();
    }

    const isValidPassword = await makeAuthService.comparePassword(
      payload.password,
      userAuth.password
    );

    if (!isValidPassword) {
      await userAuthRepo.incrementFailedLoginAttempts(user.id, {
        correlationId,
      });
      throw new authError.InvalidCredentials();
    }

    if (userAuth.failedLoginAttempts > 0) {
      await userAuthRepo.resetFailedLoginAttempts(user.id, { correlationId });
    }

    const events = eventValue.enrich(userEvents.loggedIn(user), {
      correlationId,
    });

    return makeIssueUserSessionHelper({
      user,
      reqContext,
      makeAuthService,
      userSessionRepo,
      eventBus,
      repoService,
      events,
    });
  };
}
