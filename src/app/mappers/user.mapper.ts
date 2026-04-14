import { InferSelectModel } from 'drizzle-orm';
import { IUser } from '../../domain/user/types/user.types';
import { usersInCore } from '../../infra/persistence/drizzle/schema';
import { TEntityId } from '../../shared/types/uuid';
import { fromCommonRepoDates, toCommonRepoDates } from './date';

export interface IUserModel extends InferSelectModel<typeof usersInCore> {}

const userMapper = {
  toRepo(user: IUser): IUserModel {
    return Object.freeze({
      ...user,
      ...toCommonRepoDates(user),
    });
  },

  toDomain(user: IUserModel): IUser {
    return Object.freeze({
      ...user,
      id: user.id as TEntityId,
      ...fromCommonRepoDates(user),
    });
  },

  toInterface(user: IUser): IUser {
    return Object.freeze({ ...user });
  },
};

export default userMapper;
