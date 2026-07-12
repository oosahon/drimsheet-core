import { z } from 'zod';
import userEvents from '../../../domain/user/events/user.events';
import IUserRepo from '../../../domain/user/repos/user.repo';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import IRequestContext from '../../shared/contracts/request-context.contract';
import IAuthService from '../contracts/auth-service.contract';
import IUserAuthRepo from '../contracts/user-auth.repo.contract';
import IUserSessionRepo from '../contracts/user-session.repo.contract';
import { IAccessToken, IResetPasswordReq } from '../dtos/auth.dto';
import authError from '../errors/auth.error';
import makeIssueUserSessionHelper from './helpers/issue-user-session.helper';

const validationSchema = z
  .object({
    token: z
      .string({ message: 'Token is required' })
      .min(1, 'Token is required'),
    password: z
      .string({ message: 'Password is required' })
      .min(8, { message: 'Password must be at least 8 characters' })
      .max(100, { message: 'Password must be at most 100 characters' })
      .regex(/(?=.*[0-9])/, {
        message: 'Password must contain at least one number',
      })
      .regex(/(?=.*[^A-Za-z0-9])/, {
        message: 'Password must contain at least one special character',
      }),
    confirmPassword: z.string({ message: 'Confirm password is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

interface IDependencies {
  requestContext: IRequestContext;
  userRepo: IUserRepo;
  makeAuthService: IAuthService;
  eventBus: IEventBus;
  userAuthRepo: IUserAuthRepo;
  userSessionRepo: IUserSessionRepo;
  repoService: IRepoService;
}

export default function makeResetPasswordUseCase(deps: IDependencies) {
  return async (payload: IResetPasswordReq): Promise<IAccessToken> => {
    zodValidationRunner(validationSchema, payload);

    const { correlationId, idempotencyKey } = deps.requestContext.get();

    const tokenPayload = await deps.makeAuthService.verifyPasswordResetToken(
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

    const passwordHash = await deps.makeAuthService.hashPassword(
      payload.password
    );

    const repoTransaction: TRepoTransactionFn = async (tx) => {
      await deps.userAuthRepo.update(
        { ...existingUserAuth, password: passwordHash, failedLoginAttempts: 0 },
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
      reqContext: deps.requestContext,
      makeAuthService: deps.makeAuthService,
      userSessionRepo: deps.userSessionRepo,
      eventBus: deps.eventBus,
      repoService: deps.repoService,
      events: enrichedEvent,
    });
  };
}
