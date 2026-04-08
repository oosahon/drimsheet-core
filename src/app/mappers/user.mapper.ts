import { InferSelectModel } from 'drizzle-orm';
import { IUser } from '../../domain/user/types/user.types';
import { usersInCore } from '../../infra/persistence/drizzle/schema';
import { fromCommonRepoDates, toCommonRepoDates } from './date';
import { TEntityId } from '../../shared/types/uuid';

export interface IUserModel extends InferSelectModel<typeof usersInCore> {}

const userMapper = {
  toRepo(user: IUser): IUserModel {
    return Object.freeze({
      ...user,
      ...toCommonRepoDates(user),
      password: user.password ?? null,
    });
  },

  toDomain(user: IUserModel): IUser {
    return Object.freeze({
      ...user,
      id: user.id as TEntityId,
      password: user.password ?? undefined,
      ...fromCommonRepoDates(user),
    });
  },

  toInterface(user: IUser): Omit<IUser, 'password'> {
    return Object.freeze({
      ...user,
      password: undefined,
    });
  },
};

export default userMapper;
