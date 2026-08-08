import IEventBus from '@shared/contracts/event-bus.contract';
import { IRepoService } from '@shared/contracts/repo.contract';
import zodValidationRunner from '@shared/utils/zod-validation-runner';
import eventValue from '@shared/values/events/event.vo';

import userEvents from '@domain/user/events/user.events';
import IUserRepo from '@domain/user/repos/user.repo';
import emailValue from '@domain/user/values/email.vo';

import { EAuthStrategy } from '@app/auth/contracts/auth.types';
import IPasswordService from '@app/auth/contracts/password-service.contract';
import ITokenService from '@app/auth/contracts/token-service.contract';
import IUserAuthRepo from '@app/auth/contracts/user-auth.repo.contract';
import IUserSessionRepo from '@app/auth/contracts/user-session.repo.contract';
import { IAccessToken, IEmailLoginReq } from '@app/auth/dtos/auth/auth.dto';
import { emailLoginReqValidation } from '@app/auth/dtos/auth/auth.dto.validation';
import authError from '@app/auth/errors/auth.error';
import makeIssueUserSessionHelper from '@app/auth/usecases/helpers/issue-user-session.helper';
import IAppContext from '@app/context/contracts/app-context.contract';

interface IDependencies {
  reqContext: IAppContext;
  userRepo: IUserRepo;
  passwordService: IPasswordService;
  tokenService: ITokenService;
  eventBus: IEventBus;
  userAuthRepo: IUserAuthRepo;
  userSessionRepo: IUserSessionRepo;
  repoService: IRepoService;
}

export default function makeLoginWithEmailUseCase(deps: IDependencies) {
  return async (payload: IEmailLoginReq): Promise<IAccessToken> => {
    zodValidationRunner(emailLoginReqValidation, payload);

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
      throw new authError.InvalidCredentials();
    }

    if (
      !userAuth.strategy.includes(EAuthStrategy.Email) ||
      !userAuth.password
    ) {
      await deps.userAuthRepo.incrementFailedLoginAttempts(user.id, {
        correlationId,
      });
      throw new authError.InvalidCredentials();
    }

    const isValidPassword = await deps.passwordService.compare(
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
      tokenService: deps.tokenService,
      userSessionRepo: deps.userSessionRepo,
      eventBus: deps.eventBus,
      repoService: deps.repoService,
      events,
    });
  };
}
