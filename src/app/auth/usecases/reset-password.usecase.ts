import userEvents from '../../../domain/user/events/user.events';
import IUserRepo from '../../../domain/user/repos/user.repo';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import IReporter from '../../../shared/contracts/reporter.contract';
import generateUUID from '../../../shared/utils/uuid-generator';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/values/events/event.vo';
import IAppContext from '../../context/contracts/app-context.contract';
import { EAuthStrategy } from '../contracts/auth.types';
import IPasswordService from '../contracts/password-service.contract';
import ITokenService from '../contracts/token-service.contract';
import IUserAuthRepo from '../contracts/user-auth.repo.contract';
import IUserSessionRepo from '../contracts/user-session.repo.contract';
import { IAccessToken, IResetPasswordReq } from '../dtos/auth/auth.dto';
import { resetPasswordReqValidation } from '../dtos/auth/auth.dto.validation';
import authError from '../errors/auth.error';

interface IDependencies {
  appContext: IAppContext;
  userRepo: IUserRepo;
  passwordService: IPasswordService;
  tokenService: ITokenService;
  eventBus: IEventBus;
  userAuthRepo: IUserAuthRepo;
  userSessionRepo: IUserSessionRepo;
  repoService: IRepoService;
  reporter: IReporter;
}

export default function makeResetPasswordUseCase(deps: IDependencies) {
  return async (payload: IResetPasswordReq): Promise<IAccessToken> => {
    zodValidationRunner(resetPasswordReqValidation, payload);

    const { correlationId, idempotencyKey } = deps.appContext.get();

    const tokenPayload = await deps.tokenService.claimPasswordResetToken(
      payload.token
    );
    let committed = false;
    try {
      const existingUser = await deps.userRepo.findById(tokenPayload.id, {
        correlationId,
      });

      if (!existingUser) {
        throw new authError.InvalidToken();
      }

      const existingUserAuth = await deps.userAuthRepo.findByUserId(
        existingUser.id,
        { correlationId }
      );

      if (!existingUserAuth) {
        throw new authError.InvalidToken();
      }

      const password = deps.passwordService.makePassword(payload.password);
      const passwordHash = await deps.passwordService.hash(password);
      const accessToken =
        await deps.tokenService.generateAccessToken(existingUser);
      const refreshToken =
        await deps.tokenService.generateRefreshToken(existingUser);

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
        await deps.userSessionRepo.deleteAllByUserId(existingUser.id, {
          correlationId,
          tx,
        });
        const timestamp = new Date();
        await deps.userSessionRepo.create(
          {
            id: generateUUID(),
            userId: existingUser.id,
            refreshToken,
            lastLoginAt: timestamp,
            createdAt: timestamp,
          },
          { correlationId, tx }
        );
      };
      await deps.repoService.runInTransaction(repoTransaction);
      committed = true;
      try {
        await deps.tokenService.finalizePasswordResetToken(tokenPayload);
      } catch (error) {
        deps.reporter.report(error, {
          operation: 'finalize-password-reset-token',
          userId: existingUser.id,
        });
      }
      deps.appContext.get().clientSession.setRefreshToken(refreshToken);

      const event = userEvents.passwordReset(existingUser);
      await deps.eventBus.publish(
        eventValue.enrich(event, { correlationId, idempotencyKey })
      );
      return { accessToken };
    } catch (error) {
      if (!committed) {
        try {
          await deps.tokenService.releasePasswordResetTokenClaim(tokenPayload);
        } catch (cleanupError) {
          deps.reporter.report(cleanupError, {
            operation: 'release-password-reset-token-claim',
            userId: tokenPayload.id,
          });
        }
      }
      throw error;
    }
  };
}
