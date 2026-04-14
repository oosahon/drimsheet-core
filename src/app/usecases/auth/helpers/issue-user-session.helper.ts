import userEvents from '../../../../domain/user/events/user.events';
import { IUser } from '../../../../domain/user/types/user.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import eventValue from '../../../../shared/value-objects/event.vo';
import IRequestContext from '../../../contracts/app/request-context.contract';
import { IAccessToken } from '../../../contracts/dto/auth.dto';
import IAuthService from '../../../contracts/infra/auth-service.contract';
import IEventBus from '../../../contracts/infra/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../contracts/infra/repo.contract';
import IUserSessionRepo from '../../../contracts/repos/user-session.repo.contract';

export interface IIssueUserSessionDeps {
  user: IUser;
  reqContext: IRequestContext;
  authService: IAuthService;
  userSessionRepo: IUserSessionRepo;
  eventBus: IEventBus;
  repoService: IRepoService;
}

export default async function issueUserSessionHelper({
  user,
  reqContext,
  authService,
  userSessionRepo,
  eventBus,
  repoService,
}: IIssueUserSessionDeps): Promise<IAccessToken> {
  const { correlationId, clientSession } = reqContext.get();

  const accessToken = await authService.generateAccessToken(user);
  const refreshToken = await authService.generateRefreshToken(user);

  const repoTransaction: TRepoTransactionFn = async (tx) => {
    const oldRefreshToken = clientSession.getRefreshToken();
    if (oldRefreshToken) {
      await userSessionRepo.delete(user.id, oldRefreshToken, {
        correlationId,
        tx,
      });
    }

    await userSessionRepo.save(
      {
        id: generateUUID(),
        userId: user.id,
        refreshToken,
        lastLoginAt: new Date(),
        createdAt: new Date(),
      },
      { correlationId, tx }
    );
  };

  await repoService.runInTransaction(repoTransaction);

  clientSession.setRefreshToken(refreshToken);

  eventBus.publish(
    eventValue.enrich(userEvents.loggedIn(user), { correlationId })
  );

  return { accessToken };
}
