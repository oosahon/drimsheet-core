import IEventBus from '@shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '@shared/contracts/repo.contract';
import { ITransactionContext } from '@shared/types/repo.types';
import generateUUID from '@shared/utils/uuid-generator';
import { IEvent } from '@shared/values/events/types/event.types';

import { IUser } from '@domain/user/types/user.types';

import ITokenService from '@app/auth/contracts/token-service.contract';
import IUserSessionRepo from '@app/auth/contracts/user-session.repo.contract';
import { IAccessToken } from '@app/auth/dtos/auth/auth.dto';
import IAppContext from '@app/context/contracts/app-context.contract';

export interface IIssueUserSessionDeps {
  user: IUser;
  reqContext: IAppContext;
  tokenService: ITokenService;
  userSessionRepo: IUserSessionRepo;
  eventBus: IEventBus;
  repoService: IRepoService;
  events: IEvent<unknown>[] | IEvent<unknown>;
  tx?: ITransactionContext;
  beforeCreate?: (tx: ITransactionContext) => Promise<void>;
  replaceExistingClientSession?: boolean;
}

export default async function makeIssueUserSessionHelper({
  user,
  reqContext,
  tokenService,
  userSessionRepo,
  eventBus,
  repoService,
  events,
  tx,
  beforeCreate,
  replaceExistingClientSession = true,
}: IIssueUserSessionDeps): Promise<IAccessToken> {
  const { correlationId, clientSession } = reqContext.get(['clientSession']);

  const accessToken = await tokenService.generateAccessToken(user);
  const refreshToken = await tokenService.generateRefreshToken(user);

  const repoTransaction: TRepoTransactionFn = async (transactionTx) => {
    await beforeCreate?.(transactionTx);

    const existingClientRefreshToken = clientSession.getRefreshToken();

    if (replaceExistingClientSession && existingClientRefreshToken) {
      let oldUserId = user.id;
      try {
        const decodedOld = tokenService.verifyRefreshToken(
          existingClientRefreshToken
        );
        oldUserId = decodedOld.id;
      } catch {
        // use default user.id fallback if unparseable
      }
      await userSessionRepo.delete(oldUserId, existingClientRefreshToken, {
        correlationId,
        tx: transactionTx,
      });
    }

    const existingDbRefreshToken = await userSessionRepo.findByRefreshToken(
      user.id,
      refreshToken,
      { correlationId, tx: transactionTx, lock: 'update' }
    );

    // This is in the off chance that the user makes the request twice
    if (existingDbRefreshToken) {
      await userSessionRepo.delete(
        user.id,
        existingDbRefreshToken.refreshToken,
        {
          correlationId,
          tx: transactionTx,
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
      { correlationId, tx: transactionTx }
    );
  };

  await repoService.runInTransaction(repoTransaction, tx);

  clientSession.setRefreshToken(refreshToken);

  await eventBus.publish(events);

  return { accessToken };
}
