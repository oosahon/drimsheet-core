import z from 'zod';
import userEvents from '../../../domain/user/events/user.events';
import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/value-objects/email.vo';
import { ErrorBadRequest } from '../../../shared/utils/error';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import IRequestContext from '../../contracts/app/request-context.contract';
import { IAccessToken, IEmailLoginReq } from '../../contracts/dto/auth.dto';
import IAuthService, {
  EAuthStrategy,
} from '../../contracts/infra/auth-service.contract';
import IEventBus from '../../contracts/infra/event-bus.contract';
import { IRepoService } from '../../contracts/infra/repo.contract';
import IUserAuthRepo from '../../contracts/repos/user-auth.repo.contract';
import IUserSessionRepo from '../../contracts/repos/user-session.repo.contract';
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
      throw new ErrorBadRequest('Invalid email or password');
    }

    const userAuth = await userAuthRepo.findByUserId(user.id, {
      correlationId,
    });

    if (!userAuth) {
      throw new ErrorBadRequest('Invalid email or password');
    }

    const MAX_LOGIN_ATTEMPTS = 5;

    if (userAuth.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      throw new ErrorBadRequest(
        'Account locked due to too many failed login attempts. Please reset your password.'
      );
    }

    if (
      !userAuth.strategy.includes(EAuthStrategy.Email) ||
      !userAuth.password
    ) {
      await userAuthRepo.incrementFailedLoginAttempts(user.id, {
        correlationId,
      });
      throw new ErrorBadRequest('You signed up with a different method.');
    }

    const isValidPassword = await makeAuthService.comparePassword(
      payload.password,
      userAuth.password
    );

    if (!isValidPassword) {
      await userAuthRepo.incrementFailedLoginAttempts(user.id, {
        correlationId,
      });
      throw new ErrorBadRequest('Invalid email or password');
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
