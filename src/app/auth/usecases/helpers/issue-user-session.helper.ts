import { IUser } from '../../../../domain/user/types/user.types';
import IEventBus from '../../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../../shared/contracts/repo.contract';
import { IEvent } from '../../../../shared/types/event.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import IRequestContext from '../../../shared/contracts/request-context.contract';
import IAuthService from '../../contracts/auth-service.contract';
import IUserSessionRepo from '../../contracts/user-session.repo.contract';
import { IAccessToken } from '../../dtos/auth/auth.dto';

export interface IIssueUserSessionDeps {
  user: IUser;
  reqContext: IRequestContext;
  makeAuthService: IAuthService;
  userSessionRepo: IUserSessionRepo;
  eventBus: IEventBus;
  repoService: IRepoService;
  events: IEvent<unknown>[] | IEvent<unknown>;
}

export default async function makeIssueUserSessionHelper({
  user,
  reqContext,
  makeAuthService,
  userSessionRepo,
  eventBus,
  repoService,
  events,
}: IIssueUserSessionDeps): Promise<IAccessToken> {
  const { correlationId, clientSession } = reqContext.get();

  const accessToken = await makeAuthService.generateAccessToken(user);
  const refreshToken = await makeAuthService.generateRefreshToken(user);

  const repoTransaction: TRepoTransactionFn = async (tx) => {
    const existingClientRefreshToken = clientSession.getRefreshToken();

    if (existingClientRefreshToken) {
      await userSessionRepo.delete(user.id, existingClientRefreshToken, {
        correlationId,
        tx,
      });
    }

    const existingDbRefreshToken = await userSessionRepo.findByRefreshToken(
      user.id,
      refreshToken,
      { correlationId, tx, lock: 'update' }
    );

    // This is in the off chance that use user makes the request twice
    if (existingDbRefreshToken) {
      await userSessionRepo.delete(
        user.id,
        existingDbRefreshToken.refreshToken,
        {
          correlationId,
          tx,
        }
      );
    }

    const timestamp = new Date();
    await userSessionRepo.create(
      {
        id: generateUUID(),
        userId: user.id,
        refreshToken,
        lastLoginAt: timestamp,
        createdAt: timestamp,
      },
      { correlationId, tx }
    );
  };

  await repoService.runInTransaction(repoTransaction);

  clientSession.setRefreshToken(refreshToken);

  eventBus.publish(events);

  return { accessToken };
}
