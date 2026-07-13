import z from 'zod';
import userEvents from '../../../domain/user/events/user.events';
import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/value-objects/email.vo';
import IAppContext from '../../../shared/contracts/app-context.contract';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import { IRepoService } from '../../../shared/contracts/repo.contract';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import IAuthService, {
  EAuthStrategy,
} from '../contracts/auth-service.contract';
import IUserAuthRepo from '../contracts/user-auth.repo.contract';
import IUserSessionRepo from '../contracts/user-session.repo.contract';
import { IAccessToken, IEmailLoginReq } from '../dtos/auth/auth.dto';
import authError from '../errors/auth.error';
import makeIssueUserSessionHelper from './helpers/issue-user-session.helper';

const validationSchema = z.object({
  email: z.email({ message: 'Email is required' }),
  password: z
    .string({ message: 'Password is required' })
    .max(100, { message: 'Password must be at most 100 characters' }),
});

interface IDependencies {
  reqContext: IAppContext;
  userRepo: IUserRepo;
  makeAuthService: IAuthService;
  eventBus: IEventBus;
  userAuthRepo: IUserAuthRepo;
  userSessionRepo: IUserSessionRepo;
  repoService: IRepoService;
}

export default function makeLoginWithEmailUseCase(deps: IDependencies) {
  return async (payload: IEmailLoginReq): Promise<IAccessToken> => {
    zodValidationRunner(validationSchema, payload);

    const { correlationId } = deps.reqContext.get();

    const email = emailValue.normalize(payload.email);

    const user = await deps.userRepo.findByEmail(email, { correlationId });

    if (!user) {
      throw new authError.InvalidCredentials();
    }

    const userAuth = await deps.userAuthRepo.findByUserId(user.id, {
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
      await deps.userAuthRepo.incrementFailedLoginAttempts(user.id, {
        correlationId,
      });
      throw new authError.WrongStrategy();
    }

    const isValidPassword = await deps.makeAuthService.comparePassword(
      payload.password,
      userAuth.password
    );

    if (!isValidPassword) {
      await deps.userAuthRepo.incrementFailedLoginAttempts(user.id, {
        correlationId,
      });
      throw new authError.InvalidCredentials();
    }

    if (userAuth.failedLoginAttempts > 0) {
      await deps.userAuthRepo.resetFailedLoginAttempts(user.id, {
        correlationId,
      });
    }

    const events = eventValue.enrich(userEvents.loggedIn(user), {
      correlationId,
    });

    return makeIssueUserSessionHelper({
      user,
      reqContext: deps.reqContext,
      makeAuthService: deps.makeAuthService,
      userSessionRepo: deps.userSessionRepo,
      eventBus: deps.eventBus,
      repoService: deps.repoService,
      events,
    });
  };
}
