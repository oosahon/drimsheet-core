import { z } from 'zod';
import userEvents from '../../../domain/user/events/user.events';
import IUserRepo from '../../../domain/user/repos/user.repo';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import IRequestContext from '../../../shared/contracts/request-context.contract';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import IUserAuthRepo from '../../auth/contracts/user-auth.repo.contract';
import IUserSessionRepo from '../../auth/contracts/user-session.repo.contract';
import { IAccessToken, IResetPasswordReq } from '../../auth/dtos/auth.dto';
import authError from '../../auth/errors/auth.error';
import IAuthService from '../contracts/auth-service.contract';
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

export default function makeResetPasswordUseCase(
  requestContext: IRequestContext,
  userRepo: IUserRepo,
  makeAuthService: IAuthService,
  eventBus: IEventBus,
  userAuthRepo: IUserAuthRepo,
  userSessionRepo: IUserSessionRepo,
  repoService: IRepoService
) {
  return async (payload: IResetPasswordReq): Promise<IAccessToken> => {
    zodValidationRunner(validationSchema, payload);

    const { correlationId, idempotencyKey } = requestContext.get();

    const tokenPayload = await makeAuthService.verifyPasswordResetToken(
      payload.token
    );

    const existingUser = await userRepo.findById(tokenPayload.id, {
      correlationId,
    });

    if (!existingUser) {
      throw new authError.InvalidToken();
    }

    const existingUserAuth = await userAuthRepo.findByUserId(existingUser.id, {
      correlationId,
    });

    if (!existingUserAuth) {
      throw new authError.InvalidToken();
    }

    const passwordHash = await makeAuthService.hashPassword(payload.password);

    const repoTransaction: TRepoTransactionFn = async (tx) => {
      await userAuthRepo.update(
        { ...existingUserAuth, password: passwordHash, failedLoginAttempts: 0 },
        { correlationId, tx }
      );
    };
    await repoService.runInTransaction(repoTransaction);

    const event = userEvents.passwordReset(existingUser);

    const enrichedEvent = eventValue.enrich(event, {
      correlationId,
      idempotencyKey,
    });

    return makeIssueUserSessionHelper({
      user: existingUser,
      reqContext: requestContext,
      makeAuthService,
      userSessionRepo,
      eventBus,
      repoService,
      events: enrichedEvent,
    });
  };
}
