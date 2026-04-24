import { InferSelectModel } from 'drizzle-orm';
import { userSessionsInCore } from '../../infra/config/drizzle/schema';
import { TEntityId } from '../../shared/types/uuid';
import { IUserSession } from '../contracts/infra/auth-service.contract';
import { fromRepoDate, toRepoDate } from './date';

export interface IUserSessionModel extends InferSelectModel<
  typeof userSessionsInCore
> {}

const userSessionMapper = {
  toRepo(userSession: IUserSession): IUserSessionModel {
    return Object.freeze({
      id: userSession.id,
      userId: userSession.userId,
      refreshToken: userSession.refreshToken,
      lastLoginAt: userSession.lastLoginAt
        ? toRepoDate(userSession.lastLoginAt)
        : null,
      createdAt: toRepoDate(userSession.createdAt),
    });
  },

  toDomain(userSession: IUserSessionModel): IUserSession {
    return Object.freeze({
      id: userSession.id as TEntityId,
      userId: userSession.userId as TEntityId,
      refreshToken: userSession.refreshToken,
      lastLoginAt: userSession.lastLoginAt
        ? fromRepoDate(userSession.lastLoginAt)
        : new Date(),
      createdAt: fromRepoDate(userSession.createdAt),
    });
  },
};

export default userSessionMapper;
