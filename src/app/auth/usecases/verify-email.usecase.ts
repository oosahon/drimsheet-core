import { z } from 'zod';
import userEntity from '../../../domain/user/entities/user.entity';
import IUserRepo from '../../../domain/user/repos/user.repo';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import { IRepoService } from '../../../shared/contracts/repo.contract';
import eventValue from '../../../shared/events/event.vo';
import historyValue from '../../../shared/history/history.vo';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import IAppContext from '../../context/contracts/app-context.contract';
import ITokenService, {
  IAuthTokenPayload,
} from '../contracts/token-service.contract';
import IUserSessionRepo from '../contracts/user-session.repo.contract';
import { IAccessToken } from '../dtos/auth/auth.dto';
import authError from '../errors/auth.error';
import makeIssueUserSessionHelper from './helpers/issue-user-session.helper';

const validationSchema = z.object({
  token: z.string(),
});

interface IDependencies {
  tokenService: ITokenService;
  userRepo: IUserRepo;
  appContext: IAppContext;
  eventBus: IEventBus;
  userSessionRepo: IUserSessionRepo;
  repoService: IRepoService;
}

export default function makeVerifyEmailAddressUseCase(deps: IDependencies) {
  return async (token: string): Promise<IAccessToken> => {
    zodValidationRunner(validationSchema, { token });

    const { correlationId } = deps.appContext.get();

    let decodedToken: IAuthTokenPayload | undefined;

    try {
      decodedToken = await deps.tokenService.claimSignupToken(token);

      let resultSession!: IAccessToken;

      await deps.repoService.runInTransaction(async (tx) => {
        const user = await deps.userRepo.findById(decodedToken!.id, {
          correlationId,
          lock: 'update',
          tx,
        });

        if (!user) {
          throw new authError.InvalidToken();
        }

        if (user.emailVerified) {
          resultSession = await makeIssueUserSessionHelper({
            user,
            reqContext: deps.appContext,
            tokenService: deps.tokenService,
            userSessionRepo: deps.userSessionRepo,
            eventBus: deps.eventBus,
            repoService: deps.repoService,
            events: [],
            tx,
          });
          return;
        }

        const [updatedUser, events, userAuditDelta] =
          userEntity.verifyEmail(user);

        const history = historyValue.make(
          userAuditDelta!,
          historyValue.getUserActor(user.id),
          correlationId
        );

        await deps.userRepo.update(updatedUser, {
          correlationId,
          history,
          tx,
        });

        resultSession = await makeIssueUserSessionHelper({
          user: updatedUser,
          reqContext: deps.appContext,
          tokenService: deps.tokenService,
          userSessionRepo: deps.userSessionRepo,
          eventBus: deps.eventBus,
          repoService: deps.repoService,
          events: eventValue.enrichAll(events, { correlationId }),
          tx,
        });
      });

      await deps.tokenService.finalizeSignupToken(decodedToken.id);

      return resultSession;
    } catch (error) {
      if (decodedToken?.id) {
        await deps.tokenService.releaseSignupTokenClaim(decodedToken.id);
      }
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        (error.name === 'AuthError' || error.name === 'UserError')
      ) {
        throw new authError.InvalidToken();
      }
      throw error;
    }
  };
}
