import { InferSelectModel } from 'drizzle-orm';

import {
  IUserAuth,
  UAuthStrategy,
} from '../../../../app/auth/contracts/auth.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { userAuthInCore } from '../../../config/drizzle/schema';
import { fromRepoDate, toRepoDate } from '../shared/date';

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
      strategy: userAuth.strategies as UAuthStrategy[],
      createdAt: fromRepoDate(userAuth.createdAt),
      updatedAt: fromRepoDate(userAuth.updatedAt),
    });
  },
};

export default userAuthMapper;
