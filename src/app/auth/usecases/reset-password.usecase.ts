import userEvents from '../../../domain/user/events/user.events';
import IUserRepo from '../../../domain/user/repos/user.repo';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import eventValue from '../../../shared/events/event.vo';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import IAppContext from '../../_internal/contracts/app-context.contract';
import { EAuthStrategy } from '../contracts/auth.types';
import IPasswordService from '../contracts/password-service.contract';
import ITokenService from '../contracts/token-service.contract';
import IUserAuthRepo from '../contracts/user-auth.repo.contract';
import IUserSessionRepo from '../contracts/user-session.repo.contract';
import { IAccessToken, IResetPasswordReq } from '../dtos/auth/auth.dto';
import { resetPasswordReqValidation } from '../dtos/auth/auth.dto.validation';
import authError from '../errors/auth.error';
import makeIssueUserSessionHelper from './helpers/issue-user-session.helper';

interface IDependencies {
  appContext: IAppContext;
  userRepo: IUserRepo;
  passwordService: IPasswordService;
  tokenService: ITokenService;
  eventBus: IEventBus;
  userAuthRepo: IUserAuthRepo;
  userSessionRepo: IUserSessionRepo;
  repoService: IRepoService;
}

export default function makeResetPasswordUseCase(deps: IDependencies) {
  return async (payload: IResetPasswordReq): Promise<IAccessToken> => {
    zodValidationRunner(resetPasswordReqValidation, payload);

    const { correlationId, idempotencyKey } = deps.appContext.get();

    const tokenPayload = await deps.tokenService.verifyPasswordResetToken(
      payload.token
    );

    const existingUser = await deps.userRepo.findById(tokenPayload.id, {
      correlationId,
    });

    if (!existingUser) {
      throw new authError.InvalidToken();
    }

    const existingUserAuth = await deps.userAuthRepo.findByUserId(
      existingUser.id,
      {
        correlationId,
      }
    );

    if (!existingUserAuth) {
      throw new authError.InvalidToken();
    }

    const password = deps.passwordService.makePassword(payload.password);
    const passwordHash = await deps.passwordService.hash(password);

    const repoTransaction: TRepoTransactionFn = async (tx) => {
      await deps.userAuthRepo.update(
        {
          ...existingUserAuth,
          password: passwordHash,
          failedLoginAttempts: 0,
          strategy: Array.from(
            new Set([...existingUserAuth.strategy, EAuthStrategy.Email])
          ),
        },
        { correlationId, tx }
      );
    };
    await deps.repoService.runInTransaction(repoTransaction);

    const event = userEvents.passwordReset(existingUser);

    const enrichedEvent = eventValue.enrich(event, {
      correlationId,
      idempotencyKey,
    });

    return makeIssueUserSessionHelper({
      user: existingUser,
      reqContext: deps.appContext,
      tokenService: deps.tokenService,
      userSessionRepo: deps.userSessionRepo,
      eventBus: deps.eventBus,
      repoService: deps.repoService,
      events: enrichedEvent,
    });
  };
}
