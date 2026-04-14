import { InferSelectModel } from 'drizzle-orm';

import { userAuthInCore } from '../../infra/persistence/drizzle/schema';
import { TEntityId } from '../../shared/types/uuid';
import { IUserAuth } from '../contracts/infra/auth-service.contract';
import { fromRepoDate, toRepoDate } from './date';

export interface IUserAuthModel extends InferSelectModel<
  typeof userAuthInCore
> {}

const userAuthMapper = {
  toRepo(userAuth: IUserAuth): IUserAuthModel {
    return Object.freeze({
      userId: userAuth.userId,
      password: userAuth.password ?? null,
      failedLoginAttempts: userAuth.failedLoginAttempts,
      strategies: userAuth.strategy,
      createdAt: toRepoDate(userAuth.createdAt),
      updatedAt: toRepoDate(userAuth.updatedAt),
    });
  },

  toDomain(userAuth: IUserAuthModel): IUserAuth {
    return Object.freeze({
      userId: userAuth.userId as TEntityId,
      password: userAuth.password ?? null,
      failedLoginAttempts: userAuth.failedLoginAttempts ?? 0,
      strategy: userAuth.strategies as ('email' | 'google')[],
      createdAt: fromRepoDate(userAuth.createdAt),
      updatedAt: fromRepoDate(userAuth.updatedAt),
    });
  },
};

export default userAuthMapper;
